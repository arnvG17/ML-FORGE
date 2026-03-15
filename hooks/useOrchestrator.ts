"use client";

import { useRef, useCallback, useEffect } from "react";
import { useAgentStore } from "@/store/agent";
import { useOutputStore } from "@/store/output";
import { useSessionStore } from "@/store/session";
import { extractMLCode } from "@/lib/extractMLCode";
import { runInBrowser } from "@/lib/pyodide-runner";
import { buildRepairPrompt, trimContext } from "@/lib/llm";

export type ExecutionMode = "browser" | "server" | "upload" | "advanced";

export function useOrchestrator() {
  const {
    status,
    setStatus,
    code,
    setCode,
    appendCode,
    addMessage,
    reset: resetAgent,
  } = useAgentStore();
  const { setAll: setOutput, reset: resetOutput } = useOutputStore();

  const {
    llmContext,
    appendLLMContext,
    clearLLMContext,
    setLLMContext,
    repairAttempt,
    setRepairAttempt,
    resetSession: resetSessionState,
    codeVersion,
    incrementVersion,
    setCodeVersion,
  } = useSessionStore();

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

    // We save if status is done OR if it's error after attempts
    if (agentState.status !== "done" && agentState.status !== "error") return;

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
      llmContext: trimContext(sessionState.llmContext).map((msg) => ({
        ...msg,
        createdAt: new Date(),
      })),
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
          console.error(
            "[Orchestrator] Failed to create session:",
            await res.text()
          );
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
        const newMessages = agentState.messages.slice(
          savedMessageCountRef.current
        );
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
          console.error(
            "[Orchestrator] Failed to update session:",
            await res.text()
          );
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

  // ─── capturedStream ─────────────────────────────────────────────────────
  const capturedStream = useCallback(
    async function* (
      intent: string,
      mode: ExecutionMode,
      context: any[] = [],
      skipThinking: boolean = false
    ) {
      const response = await fetch("/api/pyodide/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent, mode, context, skipThinking }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to stream from LLM");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield decoder.decode(value);
        }
      }
    },
    []
  );

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

  // ─── runWithRepairLoop ──────────────────────────────────────────────────
  const runWithRepairLoop = async (
    initialCode: string,
    maxAttempts: number = 5
  ): Promise<string | null> => {
    let currentCode = initialCode;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      setStatus(attempt === 1 ? "running" : "fixing");
      setRepairAttempt(attempt);

      try {
        const outputState = useOutputStore.getState();
        const currentParams = outputState.controls.reduce((acc, c) => {
          acc[c.targets_var] = c.default;
          return acc;
        }, {} as Record<string, any>);

        const paramsLine = `params = ${JSON.stringify(currentParams)}\n`;
        const result = await runInBrowser(paramsLine + currentCode);

        const hasErrors = result.errors && result.errors.length > 0;

        // Success check: No errors
        if (!hasErrors) {
          setOutput({
            metrics: result.metrics,
            plots: result.plots,
            controls: result.controls,
            explanation: result.explanation,
            errors: [],
          });
          return currentCode;
        }

        // Error detected - Build repair prompt
        if (attempt === 1) {
          addMessage({ role: "assistant", content: "I encountered an error. Let me fix that for you..." });
        }

        if (attempt === maxAttempts) {
          setStatus("error");
          addMessage({
            role: "assistant",
            content: `I've tried fixing this multiple times but could not resolve the issue. Please try describing your request differently.`,
          });
          return null;
        }

        const errorText = result.errors.join("\n");
        const repairPrompt = buildRepairPrompt(errorText, currentCode);

        appendLLMContext("user", repairPrompt);

        let repairedCode = "";
        const context = useSessionStore.getState().llmContext;
        const trimmed = trimContext(context);

        // Call API for repair instead of direct LLM function
        for await (const token of capturedStream(
          repairPrompt,
          "browser",
          trimmed,
          true
        )) {
          repairedCode += token;
        }

        repairedCode = extractMLCode(repairedCode);

        // Validate repair is not suspiciously short
        if (repairedCode.length < 30) {
          appendLLMContext("assistant", "[Repair attempt returned invalid output]");
          continue;
        }

        appendLLMContext("assistant", repairedCode);
        currentCode = repairedCode;

        setCode(repairedCode);
      } catch (err: any) {
        const errorText = err.message ?? String(err);
        if (attempt === 1) {
          addMessage({ role: "assistant", content: "I encountered a technical issue. Let me try to fix it..." });
        }
        if (attempt === maxAttempts) {
          setStatus("error");
          addMessage({
            role: "assistant",
            content: "I'm sorry, I couldn't resolve the issue after several attempts. Please try again.",
          });
          return null;
        }
        // Build repair for JS exception
        const repairPrompt = buildRepairPrompt(errorText, currentCode);
        appendLLMContext("user", repairPrompt);

        let repairedCode = "";
        const context = useSessionStore.getState().llmContext;
        for await (const token of capturedStream(
          repairPrompt,
          "browser",
          trimContext(context),
          true
        )) {
          repairedCode += token;
        }
        repairedCode = extractMLCode(repairedCode);
        appendLLMContext("assistant", repairedCode);
        currentCode = repairedCode;
        setCode(repairedCode);
      }
    }

    return null;
  };

  // ─── reigniteSession ────────────────────────────────────────────────────
  const reigniteSession = useCallback(
    async (sessionId: string) => {
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
        setCodeVersion(session.currentCode.version);
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

      // Restore LLM Context
      if (session.llmContext && session.llmContext.length > 0) {
        setLLMContext(session.llmContext);
      } else if (session.currentCode?.full) {
        // Fallback reconstruction for old sessions
        setLLMContext([
          { role: "user", content: session.intent || "build this ML tool" },
          { role: "assistant", content: session.currentCode.full },
        ]);
      }

      // Re-run saved code in browser
      if (session.currentCode?.full) {
        setStatus("running");
        await runWithRepairLoop(session.currentCode.full);
        setStatus("done");
      }
    },
    [setStatus, addMessage, setCode, setLLMContext, setCodeVersion, runWithRepairLoop]
  );

  // ─── reigniteSharedSession ──────────────────────────────────────────────
  const reigniteSharedSession = useCallback(
    async (shareToken: string) => {
      useSessionStore.getState().setReadOnly(true);

      const res = await fetch(`/api/sessions/share/${shareToken}`);
      if (!res.ok) {
        setStatus("error");
        addMessage({
          role: "assistant",
          content: "Could not load shared session.",
        });
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

      // Restore LLM Context
      if (session.llmContext && session.llmContext.length > 0) {
        setLLMContext(session.llmContext);
      } else if (session.currentCode?.full) {
        setLLMContext([
          { role: "user", content: session.intent || "build this ML tool" },
          { role: "assistant", content: session.currentCode.full },
        ]);
      }

      // Re-run saved code in browser
      if (session.currentCode?.full) {
        setStatus("running");
        await runWithRepairLoop(session.currentCode.full);
        setStatus("done");
      }
    },
    [setStatus, addMessage, setCode, setLLMContext, runWithRepairLoop]
  );

  // ─── shareSession ──────────────────────────────────────────────────────
  const shareSession = useCallback(
    async (visibility: "private" | "link" | "public") => {
      // Ensure session is saved first
      if (!sessionIdRef.current) {
        await saveSession();
      }
      if (!sessionIdRef.current) {
        throw new Error("No session to share");
      }

      const res = await fetch(
        `/api/sessions/${sessionIdRef.current}/visibility`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visibility }),
        }
      );
      if (!res.ok) {
        throw new Error("Failed to update visibility");
      }
      return res.json();
    },
    [saveSession]
  );

  // ─── submitIntent ───────────────────────────────────────────────────────
  const submitIntent = async (intent: string, mode: ExecutionMode) => {
    console.log(`[Orchestrator] New intent: "${intent}", mode: ${mode}`);
    resetOutput();

    const currentContext = useSessionStore.getState().llmContext;
    const isModification = currentContext.length > 0;

    if (!isModification) {
      resetSessionState();
      clearLLMContext();
    }

    setStatus("thinking");
    setCode("");
    addMessage({ role: "user", content: intent });

    let fullGeneratedCode = "";
    try {
      setStatus("writing");

      // Step 1: Generate code
      for await (const token of capturedStream(
        intent,
        mode,
        isModification ? trimContext(currentContext) : [],
        isModification
      )) {
        fullGeneratedCode += token;
        appendCode(token);
      }

      const extractedCode = extractMLCode(fullGeneratedCode);
      setCode(extractedCode);

      // Append to LLM context
      appendLLMContext("user", intent);
      appendLLMContext("assistant", fullGeneratedCode);

      // Step 2: Auto-repair loop
      incrementVersion();
      const finalCode = await runWithRepairLoop(extractedCode);
      if (!finalCode) return; // Loop gave up or error

      // Step 3: Show results
      setStatus("done");
      addMessage({
        role: "assistant",
        content: "Built and running. Adjust the controls to explore.",
      });

      // Auto-save after completion
      debouncedSave();
    } catch (err: any) {
      console.error("[Orchestrator] Workflow failed:", err.message);
      setStatus("error");
      addMessage({
        role: "assistant",
        content: "I'm sorry, I'm having trouble with the connection. Please try again in a moment.",
      });
    }
  };

  // ─── runWithParams ──────────────────────────────────────────────────────
  const runWithParams = async (params: Record<string, any>) => {
    setStatus("running");
    const setupCode = `params = ${JSON.stringify(params)}\n`;
    const fullCode = setupCode + code;
    const result = await runInBrowser(fullCode);
    setOutput({
      metrics: result.metrics,
      plots: result.plots,
      controls: result.controls,
      explanation: result.explanation,
      errors: result.errors,
    });
    setStatus(result.errors.length > 0 ? "error" : "done");
  };

  return {
    submitIntent,
    runWithParams,
    reigniteSession,
    reigniteSharedSession,
    shareSession,
    saveSession,
    sessionIdRef,
    isRunning: status === "running" || status === "fixing",
  };
}
