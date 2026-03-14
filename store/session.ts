import { create } from "zustand";
import type { Session } from "@/types";

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  isReadOnly: boolean;
  codeVersion: number;
  setSessions: (sessions: Session[]) => void;
  setCurrentSession: (session: Session | null) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;
  setReadOnly: (value: boolean) => void;
  incrementVersion: () => void;
  setCodeVersion: (version: number) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  currentSession: null,
  isReadOnly: false,
  codeVersion: 1,

  setSessions: (sessions) => set({ sessions }),

  setCurrentSession: (session) => set({ currentSession: session }),

  updateSession: (id, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
      currentSession:
        state.currentSession?.id === id
          ? { ...state.currentSession, ...updates }
          : state.currentSession,
    })),

  setReadOnly: (value) => set({ isReadOnly: value }),

  incrementVersion: () =>
    set((state) => ({ codeVersion: state.codeVersion + 1 })),

  setCodeVersion: (version) => set({ codeVersion: version }),
}));
