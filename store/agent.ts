import { create } from "zustand";
import type { SessionStatus } from "@/types";

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
  sendMessage: (content: string) => Promise<void>;
}

export const useAgentStore = create<AgentState>()((set, get) => ({
  status: "idle",
  code: "",
  messages: [],
  isStreaming: false,

  setStatus: (status: SessionStatus) => set({ status }),

  setCode: (code: string) => set({ code }),

  appendCode: (token: string) =>
    set((state: AgentState) => ({ code: state.code + token })),

  addMessage: (message: Message) =>
    set((state: AgentState) => ({ messages: [...state.messages, message] })),

  setStreaming: (isStreaming: boolean) => set({ isStreaming }),

  reset: () =>
    set({
      status: "idle",
      code: "",
      messages: [],
      isStreaming: false,
    }),

  sendMessage: async (content: string) => {
    const { messages, addMessage, setStreaming } = get();
    
    // Add user message
    const userMessage: Message = { role: "user", content };
    addMessage(userMessage);
    
    setStreaming(true);
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      // Add initial empty assistant message
      const assistantMessage: Message = { role: "assistant", content: "" };
      set((state: AgentState) => ({ messages: [...state.messages, assistantMessage] }));
      
      let accumulatedContent = "";
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          accumulatedContent += chunk;
          
          // Update the last message (the assistant's response)
          set((state: AgentState) => {
            const newMessages = [...state.messages];
            newMessages[newMessages.length - 1] = {
              role: "assistant",
              content: accumulatedContent,
            };
            return { messages: newMessages };
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      addMessage({ role: "assistant", content: "Sorry, I encountered an error. Please check your API key and try again." });
    } finally {
      setStreaming(false);
    }
  },
}));
