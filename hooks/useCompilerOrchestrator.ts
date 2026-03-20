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

  plotting: {
    code: `import matplotlib.pyplot as plt
import numpy as np
import base64
from io import BytesIO

# Create sample data
x = np.linspace(0, 10, 100)
y = np.sin(x)

# Create a plot function
def make_plot():
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.plot(x, y, 'b-', linewidth=2, label='sin(x)')
    ax.set_xlabel('X values')
    ax.set_ylabel('Y values')
    ax.set_title('Simple Sine Wave')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    # Convert to base64 for forge_result
    buf = BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=150)
    buf.seek(0)
    plot_b64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return plot_b64

# Create forge_result with plot
forge_result = {
    "metrics": {"accuracy": 0.95},
    "plots": {"main_plot": make_plot()},
    "controls": [],
    "explanation": "This demonstrates manual plot creation in forge_result",
    "errors": []
}

print("Plot created and added to forge_result!")`,
    preMessage:
      "This creates a plot manually and adds it to forge_result. The plot should now render properly in the VM output.",
  },

  seaborn: {
    code: `import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# Set style
sns.set_style("whitegrid")

# Create sample data
np.random.seed(42)
data = np.random.multivariate_normal([0, 0], [[1, 0.5], [0.5, 1]], 100)

# Create a seaborn plot
plt.figure(figsize=(10, 8))
sns.scatterplot(x=data[:, 0], y=data[:, 1], alpha=0.7, s=50)
plt.xlabel('Feature 1')
plt.ylabel('Feature 2')
plt.title('Seaborn Scatter Plot')
plt.tight_layout()

print("Seaborn plot created! Check the VM output panel.")`,
    preMessage:
      "This creates a seaborn plot. Run it to see the styled visualization rendered automatically.",
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

        // Call LLM server API — get back intent + explanation + fullCode + suggestions
        const res = await fetch("/api/compiler/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userCode: state.userCode,
            userMessage: message,
            variables,
            lastOutput,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to get response from AI");
        }

        const response = await res.json();

        // STREAM 1 → explanation goes to chat
        state.addAIMessage(response.explanation || "", "");

        // STREAM 2 → code diff goes to editor ONLY if intent is modification
        const isModification = response.intent === "modification";
        const codeChanged =
          isModification &&
          response.fullCode &&
          response.fullCode.trim() !== state.userCode.trim();

        if (codeChanged) {
          console.log("[CompilerOrchestrator] Creating diff for modification...");
          try {
            const diff = applyDiffToEditor(
              monaco,
              editor,
              state.userCode,
              response.fullCode
            );
            console.log("[CompilerOrchestrator] Diff created successfully");
            state.setPendingDiff(diff);
            
            const added = diff.displayLines.filter(l => l.type === 'added').length;
            const removed = diff.displayLines.filter(l => l.type === 'removed').length;
            state.setDiffStats({ added, removed });
          } catch (diffError: any) {
            console.error("[CompilerOrchestrator] Diff creation error:", diffError.message);
            throw diffError;
          }
        }

        state.setIsGenerating(false);

      } catch (err: any) {
        console.error("[CompilerOrchestrator] submitChat error:", err.message);
        console.error("[CompilerOrchestrator] error stack:", err.stack);
        state.addAIMessage(
          "I encountered an error while processing your request. Please check your connection and try again.",
          ""
        );
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
