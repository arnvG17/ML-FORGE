import { create } from "zustand";
import type { SessionStatus } from "@forge/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AgentState {
  status: SessionStatus;
  code: string;
  messages: Message[];
  isStreaming: boolean;
  setStatus: (status: SessionStatus) => void;
  setCode: (code: string) => void;
  appendCode: (token: string) => void;
  addMessage: (message: Message) => void;
  setStreaming: (isStreaming: boolean) => void;
  reset: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  status: "idle",
  code: "",
  messages: [],
  isStreaming: false,

  setStatus: (status) => set({ status }),

  setCode: (code) => set({ code }),

  appendCode: (token) =>
    set((state) => ({ code: state.code + token })),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setStreaming: (isStreaming) => set({ isStreaming }),

  reset: () =>
    set({
      status: "idle",
      code: "",
      messages: [],
      isStreaming: false,
    }),
}));
