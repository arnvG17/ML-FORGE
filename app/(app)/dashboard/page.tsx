"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HeroDitheringCard } from "@/components/ui/hero-dithering-card";
import { UserButton, SignOutButton } from "@/lib/auth";
import useSWR from "swr";
import Link from "next/link";
import { motion } from "framer-motion";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function SessionCard({ session }: { session: any }) {
  const accuracy = session.lastMetrics?.Accuracy;
  const version = session.currentCode?.version;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surface/50 backdrop-blur-sm border border-white/10 p-6 group hover:border-white/30 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="font-mono text-sm font-semibold text-white truncate max-w-[70%]">
          {session.name || "Untitled"}
        </div>
        <span className="text-[10px] font-mono text-zinc-600 px-1.5 py-0.5 border border-white/10">
          {session.visibility || "private"}
        </span>
      </div>
      <div className="text-[11px] font-mono text-zinc-500 mb-3">
        {session.lastOpenedAt ? timeAgo(session.lastOpenedAt) : "—"}
      </div>
      <div className="flex items-center gap-3 mb-4">
        {accuracy !== undefined && (
          <span className="text-[10px] font-mono text-zinc-400">
            Acc: {typeof accuracy === "number" ? (accuracy * 100).toFixed(1) + "%" : accuracy}
          </span>
        )}
        {version && (
          <span className="text-[10px] font-mono text-zinc-600">v{version}</span>
        )}
      </div>
      <Link
        href={`/playground/${session.sessionId}`}
        className="text-xs font-mono text-white opacity-60 group-hover:opacity-100 transition-opacity duration-150 inline-flex items-center gap-1"
      >
        Reignite <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
      </Link>
    </motion.div>
  );
}

function GalleryCard({ session }: { session: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surface/50 backdrop-blur-sm border border-white/10 p-6 group hover:border-white/30 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="font-mono text-sm font-semibold text-white truncate mb-2">
        {session.name || "Untitled"}
      </div>
      {session.intent && (
        <p className="text-[11px] font-mono text-zinc-500 mb-3 line-clamp-2">
          {session.intent}
        </p>
      )}
      <div className="flex items-center gap-3 mb-4">
        {session.rating > 0 && (
          <span className="text-[10px] font-mono text-zinc-400">
            {session.rating.toFixed(1)} ★
          </span>
        )}
        {session.forkCount > 0 && (
          <span className="text-[10px] font-mono text-zinc-600">
            forked {session.forkCount}×
          </span>
        )}
      </div>
      <Link
        href={`/p/${session.shareToken}`}
        className="text-xs font-mono text-white opacity-60 group-hover:opacity-100 transition-opacity duration-150 inline-flex items-center gap-1"
      >
        Open <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"sessions" | "community">("sessions");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: sessions, isLoading: sessionsLoading } = useSWR("/api/sessions", fetcher);

  const galleryUrl = debouncedQuery
    ? `/api/gallery?q=${encodeURIComponent(debouncedQuery)}`
    : "/api/gallery";
  const { data: gallery, isLoading: galleryLoading } = useSWR(
    activeTab === "community" ? galleryUrl : null,
    fetcher
  );

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center w-full">
      <nav className="w-full flex items-center justify-between px-4 md:px-8 py-4 md:py-5 border-b border-border z-20 bg-surface">
        <span className="text-2xl md:text-3xl font-comico tracking-tight text-white mt-1">FORGE</span>
        <div className="flex items-center gap-4 md:gap-6">
          <SignOutButton />
          <UserButton />
        </div>
      </nav>

      <main className="w-full relative px-4 md:px-8 mt-4 flex-1">
        <HeroDitheringCard
          title="Your Workspace"
          titleClassName="font-comico text-4xl md:text-6xl lg:text-7xl tracking-normal text-white mb-6 md:mb-8 leading-[1.05]"
          description="Manage your sessions, build new projects, and review past executions."
          colorFront="#8B5CF6"
          minHeight="min-h-[300px] md:min-h-[400px]"
          hideButton={true}
        />

        <div className="max-w-7xl mx-auto py-8 md:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab("sessions")}
                className={`text-2xl md:text-3xl font-comico font-normal transition-colors ${
                  activeTab === "sessions" ? "text-white" : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                Sessions
              </button>
              <button
                onClick={() => setActiveTab("community")}
                className={`text-2xl md:text-3xl font-comico font-normal transition-colors ${
                  activeTab === "community" ? "text-white" : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                Community
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/playground/new")}
              className="border border-white text-white px-6 py-3 font-mono text-sm transition-colors duration-150 ease-in-out hover:bg-white hover:text-black"
            >
              New Session
            </motion.button>
          </div>

          {activeTab === "sessions" && (
            <>
              {sessionsLoading ? (
                <div className="text-center py-20 font-light text-zinc-500 font-mono text-sm">
                  Loading sessions...
                </div>
              ) : !sessions || sessions.length === 0 ? (
                <div className="text-center py-20">
                  <p className="font-light text-zinc-500 font-mono text-sm mb-4">No sessions yet.</p>
                  <Link
                    href="/playground/new"
                    className="text-sm font-mono text-white hover:underline"
                  >
                    Start building →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sessions.map((session: any) => (
                    <SessionCard key={session.sessionId} session={session} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "community" && (
            <>
              <div className="mb-8">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search public sessions..."
                  className="w-full max-w-md bg-transparent border border-white/10 px-4 py-3 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
              {galleryLoading ? (
                <div className="text-center py-20 font-light text-zinc-500 font-mono text-sm">
                  Loading community...
                </div>
              ) : !gallery || gallery.length === 0 ? (
                <div className="text-center py-20 font-light text-zinc-500 font-mono text-sm">
                  No public sessions yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gallery.map((session: any) => (
                    <GalleryCard key={session.shareToken} session={session} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
