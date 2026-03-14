"use client";

import { useRef, useCallback, useEffect } from "react";
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
  addMessage?: (msg: any) => void;
}) {
  try {
    const result = await runInBrowser(code);
    
    if (result.errors && result.errors.length > 0) {
      config.setAll({ errors: result.errors });
      config.setStatus("error");
      if (config.addMessage) {
        config.addMessage({ role: "assistant", content: `Execution error: ${result.errors.join(", ")}` });
      }
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
    
    if (config.addMessage) {
      const messageContent = result.explanation || "Execution completed successfully.";
      config.addMessage({ role: "assistant", content: messageContent });
    }
  } catch (err: any) {
    config.setAll({ errors: [err.message] });
    config.setStatus("error");
  }
}

export function useOrchestrator() {
  const { status, setStatus, code, setCode, appendCode, addMessage, reset: resetAgent } = useAgentStore();
  const { setAll: setOutput, reset: resetOutput } = useOutputStore();

  const sessionIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedMessageCountRef = useRef<number>(0);
  const lastSavedVersionRef = useRef<number>(0);

  // ─── saveSession ────────────────────────────────────────────────────────
  const saveSession = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const agentState = useAgentStore.getState();
    const outputState = useOutputStore.getState();
    const sessionState = useSessionStore.getState();

    if (agentState.status !== "done") return;

    const fullGeneratedCode = agentState.code;
    const controls = outputState.controls;
    const currentParams: Record<string, any> = {};
    controls.forEach((c) => {
      currentParams[c.targets_var] = c.default;
    });

    const payload: any = {
      currentCode: {
        full: fullGeneratedCode,
        extractedML: fullGeneratedCode,
        version: sessionState.codeVersion,
      },
      controls,
      currentParams,
      lastMetrics: outputState.metrics,
      executionMode: "browser",
      intent: agentState.messages[0]?.content ?? "",
      name: (agentState.messages[0]?.content ?? "Untitled").slice(0, 60),
    };

    try {
      if (!sessionIdRef.current) {
        // First save — create session via POST
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          console.error("[Orchestrator] Failed to create session:", await res.text());
          return;
        }
        const data = await res.json();
        sessionIdRef.current = data.sessionId;

        // Update URL without page reload
        window.history.replaceState({}, "", `/playground/${data.sessionId}`);

        // Track what we've saved
        savedMessageCountRef.current = agentState.messages.length;
        lastSavedVersionRef.current = sessionState.codeVersion;
      } else {
        // Subsequent saves — PATCH
        const update: any = { $set: payload };

        // Push new conversation messages
        const newMessages = agentState.messages.slice(savedMessageCountRef.current);
        if (newMessages.length > 0) {
          update.$push = {
            conversation: newMessages.map((m) => ({
              role: m.role === "assistant" ? "agent" : m.role,
              content: m.content,
              codeVersion: sessionState.codeVersion,
              createdAt: new Date(),
            })),
          };
          savedMessageCountRef.current = agentState.messages.length;
        }

        // Push code version if changed
        if (sessionState.codeVersion > lastSavedVersionRef.current) {
          if (!update.$push) update.$push = {};
          update.$push.codeVersions = {
            version: sessionState.codeVersion,
            fullCode: fullGeneratedCode,
            extractedML: fullGeneratedCode,
            changeDescription: "Updated",
            createdAt: new Date(),
          };
          lastSavedVersionRef.current = sessionState.codeVersion;
        }

        const res = await fetch(`/api/sessions/${sessionIdRef.current}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(update),
        });
        if (!res.ok) {
          console.error("[Orchestrator] Failed to update session:", await res.text());
        }
      }
    } catch (err) {
      console.error("[Orchestrator] Save error:", err);
    }
  }, []);

  // Debounced save
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(saveSession, 3000);
  }, [saveSession]);

  // beforeunload handler
  useEffect(() => {
    const handler = () => {
      saveSession();
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [saveSession]);

  // ─── reigniteSession ────────────────────────────────────────────────────
  const reigniteSession = useCallback(async (sessionId: string) => {
    sessionIdRef.current = sessionId;
    useSessionStore.getState().setReadOnly(false);

    const res = await fetch(`/api/sessions/${sessionId}`);
    if (!res.ok) {
      setStatus("error");
      addMessage({ role: "assistant", content: "Could not load session." });
      return;
    }
    const session = await res.json();

    // Restore state
    if (session.currentCode?.full) {
      setCode(session.currentCode.full);
    }
    if (session.currentCode?.version) {
      useSessionStore.getState().setCodeVersion(session.currentCode.version);
      lastSavedVersionRef.current = session.currentCode.version;
    }
    if (session.controls) {
      useOutputStore.getState().setControls(session.controls);
    }
    if (session.conversation) {
      session.conversation.forEach((msg: any) => {
        addMessage({
          role: msg.role === "agent" ? "assistant" : msg.role,
          content: msg.content,
        });
      });
      savedMessageCountRef.current = session.conversation.length;
    }

    // Re-run saved code in browser
    if (session.currentCode?.full) {
      setStatus("running");
      const paramsLine = `params = ${JSON.stringify(session.currentParams || {})}\n`;
      await runBrowser(paramsLine + session.currentCode.full, session.currentParams || {}, {
        setAll: setOutput,
        setStatus,
      });
    }
  }, [setStatus, addMessage, setCode, setOutput]);

  // ─── reigniteSharedSession ──────────────────────────────────────────────
  const reigniteSharedSession = useCallback(async (shareToken: string) => {
    useSessionStore.getState().setReadOnly(true);

    const res = await fetch(`/api/sessions/share/${shareToken}`);
    if (!res.ok) {
      setStatus("error");
      addMessage({ role: "assistant", content: "Could not load shared session." });
      return;
    }
    const session = await res.json();

    // Restore state
    if (session.currentCode?.full) {
      setCode(session.currentCode.full);
    }
    if (session.controls) {
      useOutputStore.getState().setControls(session.controls);
    }
    if (session.conversation) {
      session.conversation.forEach((msg: any) => {
        addMessage({
          role: msg.role === "agent" ? "assistant" : msg.role,
          content: msg.content,
        });
      });
    }

    // Re-run saved code in browser
    if (session.currentCode?.full) {
      setStatus("running");
      const paramsLine = `params = ${JSON.stringify(session.currentParams || {})}\n`;
      await runBrowser(paramsLine + session.currentCode.full, session.currentParams || {}, {
        setAll: setOutput,
        setStatus,
      });
    }
  }, [setStatus, addMessage, setCode, setOutput]);

  // ─── shareSession ──────────────────────────────────────────────────────
  const shareSession = useCallback(async (visibility: "private" | "link" | "public") => {
    // Ensure session is saved first
    if (!sessionIdRef.current) {
      await saveSession();
    }
    if (!sessionIdRef.current) {
      throw new Error("No session to share");
    }

    const res = await fetch(`/api/sessions/${sessionIdRef.current}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility }),
    });
    if (!res.ok) {
      throw new Error("Failed to update visibility");
    }
    return res.json();
  }, [saveSession]);

  // ─── submitIntent ───────────────────────────────────────────────────────
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

      // Increment code version
      useSessionStore.getState().incrementVersion();

      if (mode === "browser") {
        const setupCode = "params = {}\n";
        const fullCode = setupCode + extractedCode;
        await runBrowser(fullCode, {}, { setAll: setOutput, setStatus, addMessage });
      }

      // Auto-save after completion
      debouncedSave();
    } catch (err: any) {
      console.error("[Orchestrator] Workflow failed:", err.message);
      setStatus("error");
      addMessage({ role: "assistant", content: `Workflow error: ${err.message}` });
    }
  };

  // ─── runWithParams ──────────────────────────────────────────────────────
  const runWithParams = async (params: Record<string, any>) => {
    setStatus("running");
    const setupCode = `params = ${JSON.stringify(params)}\n`;
    const fullCode = setupCode + code;
    await runBrowser(fullCode, params, { setAll: setOutput, setStatus });
  };

  return {
    submitIntent,
    runWithParams,
    reigniteSession,
    reigniteSharedSession,
    shareSession,
    saveSession,
    sessionIdRef,
    isRunning: status === "running",
  };
}
