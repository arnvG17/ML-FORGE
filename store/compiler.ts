import { create } from "zustand";
import type { RunResult, VariableInfo } from "@/lib/pyodideRuntime";

// ── Types ───────────────────────────────────────────────────────────

export interface CompilerMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  code: string;
  output: RunResult | null;
}

interface CompilerState {
  pyodideStatus: "loading" | "ready" | "running" | "error";
  userCode: string;
  sessionId: string | null;
  window1Output: RunResult | null;
  variables: VariableInfo[];
  chatHistory: CompilerMessage[];
  isGenerating: boolean;
  isExecutingAI: boolean;

  setPyodideStatus: (s: CompilerState["pyodideStatus"]) => void;
  setUserCode: (code: string) => void;
  setSessionId: (id: string | null) => void;
  setWindow1Output: (result: RunResult | null) => void;
  setVariables: (vars: VariableInfo[]) => void;
  addUserMessage: (text: string) => void;
  addAIMessage: (text: string, code: string) => string;
  updateAIMessageCode: (id: string, code: string) => void;
  setAIMessageOutput: (id: string, output: RunResult | null) => void;
  setIsGenerating: (b: boolean) => void;
  setIsExecutingAI: (b: boolean) => void;
  resetChat: () => void;
}

// ── Simple ID generator (avoids importing nanoid) ───────────────────
let _compilerMsgId = 0;
function nextId(): string {
  return `cmsg_${Date.now()}_${++_compilerMsgId}`;
}

// ── Store ───────────────────────────────────────────────────────────

export const useCompilerStore = create<CompilerState>((set) => ({
  pyodideStatus: "loading",
  userCode: "# Paste your Python code here, or pick an example →\n",
  sessionId: null,
  window1Output: null,
  variables: [],
  chatHistory: [],
  isGenerating: false,
  isExecutingAI: false,

  setPyodideStatus: (s) => set({ pyodideStatus: s }),

  setUserCode: (code) => set({ userCode: code }),

  setSessionId: (id) => set({ sessionId: id }),

  setWindow1Output: (result) => set({ window1Output: result }),

  setVariables: (vars) => set({ variables: vars }),

  addUserMessage: (text) =>
    set((state) => ({
      chatHistory: [
        ...state.chatHistory,
        { id: nextId(), role: "user", text, code: "", output: null },
      ],
    })),

  addAIMessage: (text, code) => {
    const id = nextId();
    set((state) => ({
      chatHistory: [
        ...state.chatHistory,
        { id, role: "ai", text, code, output: null },
      ],
    }));
    return id;
  },

  updateAIMessageCode: (id, code) =>
    set((state) => ({
      chatHistory: state.chatHistory.map((msg) =>
        msg.id === id ? { ...msg, code } : msg
      ),
    })),

  setAIMessageOutput: (id, output) =>
    set((state) => ({
      chatHistory: state.chatHistory.map((msg) =>
        msg.id === id ? { ...msg, output } : msg
      ),
    })),

  setIsGenerating: (b) => set({ isGenerating: b }),

  setIsExecutingAI: (b) => set({ isExecutingAI: b }),

  resetChat: () =>
    set({
      chatHistory: [],
      variables: [],
      window1Output: null,
    }),
}));
