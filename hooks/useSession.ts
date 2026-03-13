"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSessionStore } from "@/store/session";
import type { Session } from "@/types";

export function useSession(sessionId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentSession, setCurrentSession } = useSessionStore();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await api.get<Session>(`/sessions/${sessionId}`);
        setCurrentSession(session);
      } catch (err: any) {
        setError(err.message || "Failed to load session");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, setCurrentSession]);

  return { session: currentSession, loading, error };
}
