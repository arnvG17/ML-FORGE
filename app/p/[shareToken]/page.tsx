"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrchestrator } from "@/hooks/useOrchestrator";
import { useAgentStore } from "@/store/agent";
import { useOutputStore } from "@/store/output";
import { motion } from "framer-motion";
import ControlsRenderer from "@/components/playground/ControlsRenderer";
import MetricCard from "@/components/playground/MetricCard";
import PlotViewer from "@/components/playground/PlotViewer";
import { TextEffect } from "@/components/ui/text-effect";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function SharedPlaygroundPage() {
  const params = useParams();
  const router = useRouter();
  const shareToken = params.shareToken as string;
  const { reigniteSharedSession } = useOrchestrator();
  const messages = useAgentStore((s) => s.messages);
  const status = useAgentStore((s) => s.status);
  const metrics = useOutputStore((s) => s.metrics);
  const plots = useOutputStore((s) => s.plots);
  const controls = useOutputStore((s) => s.controls);
  const [sessionMeta, setSessionMeta] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const hasReignited = useRef(false);

  useEffect(() => {
    if (hasReignited.current) return;
    hasReignited.current = true;

    async function load() {
      const res = await fetch(`/api/sessions/share/${shareToken}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setSessionMeta(data);
      await reigniteSharedSession(shareToken);
    }
    load();
  }, [shareToken, reigniteSharedSession]);

  const handleFork = async () => {
    const res = await fetch(`/api/sessions/share/${shareToken}/fork`, { method: "POST" });
    if (res.status === 401) {
      router.push(`/sign-up?redirect_url=/p/${shareToken}`);
      return;
    }
    const data = await res.json();
    if (data.sessionId) {
      router.push(`/playground/${data.sessionId}`);
    }
  };

  const handleRate = async (star: number) => {
    setRating(star);
    await fetch(`/api/sessions/share/${shareToken}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: star }),
    });
    setRatingSubmitted(true);
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-foreground font-mono text-sm">
              This playground is private or does not exist.
            </p>
            <Link href="/" className="text-xs font-mono text-muted hover:text-foreground transition-colors">
              Go home →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left – Conversation (read-only) */}
        <div className="w-full md:w-[320px] flex flex-col border-r border-border min-h-[40vh] md:min-h-screen bg-surface">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <span className="font-mono text-xs text-muted">FORGE</span>
            <span className="font-mono text-[10px] text-muted/60">
              {shareToken.slice(0, 8)}
            </span>
          </div>
          {sessionMeta?.intent && (
            <div className="mx-4 mt-4 px-3 py-2 border border-border rounded-lg bg-background/50">
              <p className="text-[11px] font-mono text-muted leading-relaxed">
                {sessionMeta.intent}
              </p>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
            {messages.map((msg: Message, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-mono font-bold ${
                  msg.role === "user" 
                    ? "bg-primary text-white" 
                    : "bg-elevated text-foreground border border-border"
                }`}>
                  {msg.role === "user" ? "Y" : "F"}
                </div>
                <div className={`p-2.5 rounded-xl max-w-[85%] text-[12px] font-mono leading-relaxed shadow-sm
                  ${msg.role === "user" 
                    ? "bg-primary border border-primary text-white" 
                    : "bg-elevated border border-border text-foreground"}`}
                >
                  <TextEffect per="word" preset="blur">{msg.content}</TextEffect>
                </div>
              </motion.div>
            ))}
          </div>
          {/* View-only notice */}
          <div className="px-4 py-3 border-t border-border mt-auto">
            <p className="text-[10px] font-mono text-muted/60 text-center">
              View-only · No edit controls
            </p>
          </div>
        </div>

        {/* Right – Controls + Metrics + Plots */}
        <div className="flex-1 overflow-y-auto pb-8 bg-background">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <span className="text-xs font-mono text-muted">
              {status === "running" ? "Running..." : sessionMeta?.name || "Session"}
            </span>
            <div className="flex items-center gap-3">
              <Link
                href={`/playground/${sessionMeta?.sessionId || "new"}`}
                className="text-[10px] font-mono text-muted hover:text-foreground transition-colors"
              >
                Open in Forge →
              </Link>
              <button
                onClick={handleFork}
                className="text-[10px] font-mono px-3 py-1.5 border border-border hover:border-primary/50 text-foreground rounded transition-colors bg-surface"
              >
                Fork
              </button>
            </div>
          </div>

          {controls.length > 0 && (
            <div className="px-6 py-5 border-b border-border">
              <ControlsRenderer controls={controls} sessionId={shareToken} />
            </div>
          )}

          {Object.keys(metrics).length > 0 && (
            <div className="px-6 py-5 border-b border-border">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(metrics).map(([key, value]) => (
                  <MetricCard key={key} label={key} value={value} />
                ))}
              </div>
            </div>
          )}

          {Object.keys(plots).length > 0 && (
            <div className="px-6 py-5 border-b border-border">
              {Object.entries(plots).map(([name, base64]) => (
                <PlotViewer key={name} name={name} base64={base64 as string} />
              ))}
            </div>
          )}

          {/* Rating – only for public sessions */}
          {sessionMeta?.visibility === "public" && (
            <div className="px-6 py-5">
              <p className="text-[10px] font-mono text-muted mb-3 uppercase tracking-wider">
                Rate this session
              </p>
              {ratingSubmitted ? (
                <p className="text-[11px] font-mono text-foreground font-light">
                  Thanks for your rating!
                </p>
              ) : (
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRate(star)}
                      className={`w-3 h-3 rounded-full border transition-colors ${
                        star <= rating
                          ? "bg-primary border-primary"
                          : "bg-transparent border-border hover:border-primary/50"
                      }`}
                    />
                  ))}
                </div>
              )}
              {sessionMeta?.ratingCount > 0 && (
                <p className="text-[10px] font-mono text-muted mt-2">
                  {sessionMeta.rating.toFixed(1)} / 5 · {sessionMeta.ratingCount} ratings
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
