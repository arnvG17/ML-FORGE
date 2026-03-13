"use client";

import { useAgentStore } from "@/store/agent";
import { useOutputStore } from "@/store/output";
import { useSessionStore } from "@/store/session";
import { extractMLCode } from "@/lib/extractMLCode";
import { runInBrowser } from "@/lib/pyodide-runner";

export type ExecutionMode = "browser" | "server" | "upload" | "advanced";

async function streamAndStore(intent: string, mode: ExecutionMode, streamTokens: AsyncGenerator<string>, config: {
  setStatus: (status: any) => void;
  appendCode: (token: string) => void;
}) {
  config.setStatus("writing");
  for await (const token of streamTokens) {
    config.appendCode(token);
  }
}

async function runBrowser(code: string, params: Record<string, any>, config: {
  setAll: (data: any) => void;
  setStatus: (status: any) => void;
  addMessage: (msg: any) => void;
}) {
  try {
    const result = await runInBrowser(code);
    
    if (result.errors && result.errors.length > 0) {
      config.setAll({ errors: result.errors });
      config.setStatus("error");
      config.addMessage({ role: "assistant", content: `Execution error: ${result.errors.join(", ")}` });
      return;
    }

    config.setAll({
      metrics: result.metrics,
      plots: result.plots,
      controls: result.controls,
      explanation: result.explanation,
      errors: [],
    });
    config.setStatus("done");
    config.addMessage({ role: "assistant", content: "Execution completed successfully." });
  } catch (err: any) {
    config.setAll({ errors: [err.message] });
    config.setStatus("error");
  }
}

export function useOrchestrator() {
  const { status, setStatus, code, setCode, appendCode, addMessage, reset: resetAgent } = useAgentStore();
  const { setAll: setOutput, reset: resetOutput } = useOutputStore();

  const submitIntent = async (intent: string, mode: ExecutionMode) => {
    console.log(`[Orchestrator] New intent: "${intent}", mode: ${mode}`);
    resetOutput();
    setStatus("thinking");
    setCode("");
    addMessage({ role: "user", content: intent });

    let fullGeneratedCode = "";
    async function* capturedStream() {
      console.log("[Orchestrator] Fetching stream from /api/pyodide/stream...");
      const response = await fetch("/api/pyodide/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent, mode }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Orchestrator] API error:", errorText);
        throw new Error(errorText || "Failed to stream from LLM");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let tokenCount = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const token = decoder.decode(value);
          fullGeneratedCode += token;
          tokenCount++;
          yield token;
        }
        console.log(`[Orchestrator] Stream received. Tokens: ${tokenCount}`);
      }
    }

    try {
      await streamAndStore(intent, mode, capturedStream(), { setStatus, appendCode });
      
      console.log("[Orchestrator] RAW GENERATED CODE:\n", fullGeneratedCode);
      
      console.log("[Orchestrator] Cleaning generated code...");
      const extractedCode = extractMLCode(fullGeneratedCode);
      setCode(extractedCode);
      
      console.log("[Orchestrator] EXTRACTED CODE TO RUN:\n", extractedCode);
      
      console.log("[Orchestrator] Transitioning to execution...");
      setStatus("running");

      if (mode === "browser") {
        const setupCode = "params = {}\n";
        const fullCode = setupCode + extractedCode;
        await runBrowser(fullCode, {}, { setAll: setOutput, setStatus, addMessage });
      }
    } catch (err: any) {
      console.error("[Orchestrator] Workflow failed:", err.message);
      setStatus("error");
      addMessage({ role: "assistant", content: `Workflow error: ${err.message}` });
    }
  };

  const runWithParams = async (params: Record<string, any>) => {
    setStatus("running");
    const setupCode = `params = ${JSON.stringify(params)}\n`;
    const fullCode = setupCode + code;
    await runBrowser(fullCode, params, { setAll: setOutput, setStatus, addMessage });
  };

  return {
    submitIntent,
    runWithParams,
    isRunning: status === "running",
  };
}
