"use client";

import { useCallback, useRef } from "react";
import { useCompilerStore } from "@/store/compiler";
import {
  runUserCode as pyRunUser,
  runAICode as pyRunAI,
  inspectNamespace,
} from "@/lib/pyodideRuntime";

import {
  getCompilerResponse,
} from "@/lib/llm";
import {
  applyDiffToEditor,
  acceptDiff as libAcceptDiff,
  rejectDiff as libRejectDiff,
} from "@/lib/editorDiff";
import type * as monacoType from "monaco-editor";

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
// Hook
// ═══════════════════════════════════════════════════════════════════

export function useCompilerOrchestrator(
  editor: monacoType.editor.IStandaloneCodeEditor | null,
  monaco: typeof monacoType | null
) {
  const store = useCompilerStore();
  const isSubmittingRef = useRef(false);

  // ── submitChat ──────────────────────────────────────────────────
  const submitChat = useCallback(
    async (message: string) => {
      if (isSubmittingRef.current || !editor || !monaco) return;
      isSubmittingRef.current = true;

      const state = useCompilerStore.getState();

      try {
        state.addUserMessage(message);
        state.setIsGenerating(true);

        const variables = state.variables
          .map(v => `${v.name}: ${v.typeName} ${v.shape}`)
          .join('\n');

        const lastOutput = (state.window1Output?.stdout ?? []).slice(-5).join('\n');

        // Call LLM — get back explanation + fullCode + suggestions
        const response = await getCompilerResponse(
          state.userCode,
          message,
          variables,
          lastOutput
        );

        // STREAM 1 → explanation goes to chat
        state.addAIMessage(response.explanation, "");
        // We handle suggestions if needed, the store needs updating to support them
        // For now, suggestions are not in the message type but we can add them

        // STREAM 2 → code diff goes to editor
        const codeChanged = response.fullCode.trim() !== state.userCode.trim();

        if (codeChanged) {
          const diff = applyDiffToEditor(
            monaco,
            editor,
            state.userCode,
            response.fullCode
          );
          state.setPendingDiff(diff);
          
          const added = diff.displayLines.filter(l => l.type === 'added').length;
          const removed = diff.displayLines.filter(l => l.type === 'removed').length;
          state.setDiffStats({ added, removed });
        }

        state.setIsGenerating(false);

      } catch (err: any) {
        console.error("[CompilerOrchestrator] submitChat error:", err.message);
        state.setIsGenerating(false);
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [editor, monaco]
  );

  // ── acceptDiff ──────────────────────────────────────────────────
  const acceptDiff = useCallback(async () => {
    const state = useCompilerStore.getState();
    if (!state.pendingDiff || !editor) return;

    // 1. Apply accepted code to editor
    const finalCode = libAcceptDiff(editor, state.pendingDiff);

    // 2. Update store
    state.setUserCode(finalCode);
    state.setPendingDiff(null);
    state.setDiffStats(null);

    // 3. STREAM 3 → run code, output goes to VM
    state.setPyodideStatus("running");
    const result = await pyRunUser(finalCode);
    state.setWindow1Output(result);

    if (!result.error) {
      const vars = await inspectNamespace();
      state.setVariables(vars);
    }
    state.setPyodideStatus("ready");
  }, [editor]);

  // ── rejectDiff ──────────────────────────────────────────────────
  const rejectDiff = useCallback(() => {
    const state = useCompilerStore.getState();
    if (!state.pendingDiff || !editor) return;
    libRejectDiff(editor, state.pendingDiff);
    state.setPendingDiff(null);
    state.setDiffStats(null);
  }, [editor]);

  // ── runUserCode ─────────────────────────────────────────────────
  const runUserCode = useCallback(async () => {
    const state = useCompilerStore.getState();
    state.setPyodideStatus("running");

    const result = await pyRunUser(state.userCode);
    state.setWindow1Output(result);

    // Inspect namespace after successful run
    if (!result.error) {
      const vars = await inspectNamespace();
      state.setVariables(vars);
    }

    state.setPyodideStatus("ready");
  }, []);

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
    acceptDiff,
    rejectDiff,
    loadExample,
    isRunning: store.pyodideStatus === "running",
  };
}
