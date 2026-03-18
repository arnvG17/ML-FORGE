"use client";

import { useCallback, useRef } from "react";
import { useCompilerStore } from "@/store/compiler";
import {
  runUserCode as pyRunUser,
  runAICode as pyRunAI,
  inspectNamespace,
} from "@/lib/pyodideRuntime";

// ═══════════════════════════════════════════════════════════════════
// Starter Examples
// ═══════════════════════════════════════════════════════════════════

const STARTERS: Record<string, { code: string; preMessage: string }> = {
  ml: {
    code: `from sklearn.datasets import load_iris
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split

data = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42)

model = DecisionTreeClassifier(max_depth=3, random_state=42)
model.fit(X_train, y_train)

accuracy = model.score(X_test, y_test)
print(f"Accuracy: {accuracy:.3f}")`,
    preMessage:
      "This trains a decision tree to identify iris flower species. Run it to see how accurate it is.",
  },

  sorting: {
    code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

numbers = [64, 34, 25, 12, 22, 11, 90]
print("Before:", numbers)
result = bubble_sort(numbers.copy())
print("After: ", result)`,
    preMessage: "This sorts a list using bubble sort. Run it to see it work.",
  },

  pandas: {
    code: `import pandas as pd

df = pd.DataFrame({
    'name':   ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'],
    'age':    [24, 31, 29, 45, 38],
    'salary': [52000, 67000, 61000, 89000, 74000]
})

print(df.describe())
print(f"\\nHighest salary: {df['salary'].max()}")
print(f"Average age: {df['age'].mean():.1f}")`,
    preMessage:
      "This creates a table of employee data and runs basic statistics. Run it to see the summary.",
  },

  recursion: {
    code: `def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)

for i in range(8):
    print(f"factorial({i}) = {factorial(i)}")`,
    preMessage:
      "This shows factorial, a classic recursive function. Run it to see how it builds up answers.",
  },
};

// ═══════════════════════════════════════════════════════════════════
// Auto-explain message (internal, not shown as user bubble)
// ═══════════════════════════════════════════════════════════════════

const AUTO_EXPLAIN_MESSAGE =
  "Look at the variables in scope. Write 3-5 lines of code that reveal what the key objects contain — shapes, types, values. Make it feel like 'here is what just happened in your code'.";

// ═══════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════

export function useCompilerOrchestrator() {
  const store = useCompilerStore();
  const isSubmittingRef = useRef(false);

  // ── submitChat ──────────────────────────────────────────────────
  const submitChat = useCallback(
    async (message: string, isInternal = false) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      const state = useCompilerStore.getState();

      try {
        // Add user bubble (unless internal auto-explain)
        if (!isInternal) {
          state.addUserMessage(message);
        }

        state.setIsGenerating(true);
        const aiMsgId = state.addAIMessage("", "");

        // Build chat history for the API
        const chatForApi = useCompilerStore
          .getState()
          .chatHistory.filter((m) => m.role === "user" || (m.role === "ai" && m.code))
          .map((m) => ({
            role: m.role,
            text: m.role === "user" ? m.text : m.code,
          }));

        // Stream from API
        const response = await fetch("/api/compiler/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userCode: state.userCode,
            variables: state.variables,
            chatHistory: chatForApi,
            userMessage: message,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || "Failed to stream from LLM");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value);
            useCompilerStore
              .getState()
              .updateAIMessageCode(aiMsgId, accumulated);
          }
        }

        useCompilerStore.getState().setIsGenerating(false);

        // Execute the AI's code in the shared namespace
        if (accumulated.trim()) {
          useCompilerStore.getState().setIsExecutingAI(true);
          const result = await pyRunAI(accumulated);
          useCompilerStore.getState().setAIMessageOutput(aiMsgId, result);
          useCompilerStore.getState().setIsExecutingAI(false);
        }
      } catch (err: any) {
        console.error("[CompilerOrchestrator] submitChat error:", err.message);
        useCompilerStore.getState().setIsGenerating(false);
        useCompilerStore.getState().setIsExecutingAI(false);
      } finally {
        isSubmittingRef.current = false;
      }
    },
    []
  );

  // ── runUserCode ─────────────────────────────────────────────────
  const runUserCode = useCallback(async () => {
    const state = useCompilerStore.getState();
    state.setPyodideStatus("running");

    const result = await pyRunUser(state.userCode);
    useCompilerStore.getState().setWindow1Output(result);

    // Inspect namespace after successful run
    if (!result.error) {
      const vars = await inspectNamespace();
      useCompilerStore.getState().setVariables(vars);
    }

    useCompilerStore.getState().setPyodideStatus("ready");

    // Auto-explain on first successful run
    const currentHistory = useCompilerStore.getState().chatHistory;
    if (currentHistory.length === 0 && !result.error) {
      await submitChat(AUTO_EXPLAIN_MESSAGE, true);
    }
  }, [submitChat]);

  // ── loadExample ─────────────────────────────────────────────────
  const loadExample = useCallback((type: string) => {
    const example = STARTERS[type];
    if (!example) return;

    const state = useCompilerStore.getState();
    state.resetChat();
    state.setUserCode(example.code);
    state.setWindow1Output(null);
    state.addAIMessage(example.preMessage, "");
  }, []);

  return {
    runUserCode,
    submitChat,
    loadExample,
    isRunning: store.pyodideStatus === "running",
  };
}
