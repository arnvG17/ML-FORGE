import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GraphingState {
  isGraphingEnabled: boolean;
  setGraphingEnabled: (enabled: boolean) => void;
  toggleGraphing: () => void;
}

export const useGraphingStore = create<GraphingState>()(
  persist(
    (set) => ({
      isGraphingEnabled: false,
      
      setGraphingEnabled: (enabled: boolean) => set({ isGraphingEnabled: enabled }),
      
      toggleGraphing: () => set((state) => ({ isGraphingEnabled: !state.isGraphingEnabled })),
    }),
    {
      name: "graphing-storage",
    }
  )
);
