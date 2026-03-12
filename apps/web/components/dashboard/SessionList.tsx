"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SessionCard from "./SessionCard";

interface Session {
  id: string;
  name: string;
  status: string;
  last_algorithm: string | null;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "forge_sessions";

function loadSessions(): Session[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveSessions(sessions: Session[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function createLocalSession(name: string = "Untitled Session"): Session {
  const session: Session = {
    id: crypto.randomUUID(),
    name,
    status: "idle",
    last_algorithm: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const sessions = loadSessions();
  sessions.unshift(session);
  saveSessions(sessions);
  return session;
}

export default function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSessions(loadSessions());
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 font-light text-muted font-mono text-sm">
        Loading sessions...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-20 font-light text-placeholder font-mono text-sm">
        No sessions yet. Start building.
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </motion.div>
  );
}
