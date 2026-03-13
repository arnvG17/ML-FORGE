"use client";

import { useCallback, useRef } from "react";
import { createSSEStream } from "@/lib/sse";
import { useAgentStore } from "@/store/agent";
import { useOutputStore } from "@/store/output";

export function useAgentStream(sessionId: string) {
  const abortRef = useRef<AbortController | null>(null);
  const {
    isStreaming,
    setStreaming,
    setStatus,
    setCode,
    appendCode,
    addMessage,
  } = useAgentStore();
  const { setAll } = useOutputStore();

  const sendIntent = useCallback(
    (intent: string) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }

      addMessage({ role: "user", content: intent });
      setStreaming(true);
      setStatus("thinking");
      setCode("");

      const controller = createSSEStream(
        "/execute",
        { session_id: sessionId, intent },
        {
          onToken: (token) => {
            setStatus("writing");
            appendCode(token);
          },
          onDone: (data) => {
            setStatus("done");
            setStreaming(false);

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setCode(parsed.content);
              }
              if (parsed.schema) {
                setAll({
                  controls: parsed.schema.controls || [],
                });
              }
              addMessage({
                role: "assistant",
                content: "Code generated successfully.",
              });
            } catch {
              addMessage({
                role: "assistant",
                content: "Code generated.",
              });
            }
          },
          onError: (error) => {
            setStatus("error");
            setStreaming(false);
            addMessage({
              role: "assistant",
              content: `Error: ${error}`,
            });
          },
        }
      );

      abortRef.current = controller;
    },
    [sessionId, addMessage, setStreaming, setStatus, setCode, appendCode, setAll]
  );

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStreaming(false);
    setStatus("idle");
  }, [setStreaming, setStatus]);

  return { sendIntent, cancel, isStreaming };
}
