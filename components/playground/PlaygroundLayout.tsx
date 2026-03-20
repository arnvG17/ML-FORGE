"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import CenterPanel from "./CenterPanel";
import RightPanel from "./RightPanel";
import { useAgentStore } from "@/store/agent";
import { useSessionStore } from "@/store/session";
import { useOutputStore } from "@/store/output";
import { useCompilerStore } from "@/store/compiler";
import { useRouter } from "next/navigation";
import { HeroDitheringCard } from "@/components/ui/hero-dithering-card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useOrchestrator } from "@/hooks/useOrchestrator";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { MorphingSquare } from "@/components/ui/morphing-square";
import { TextEffect } from "@/components/ui/text-effect";

import ChatPanel from "./ChatPanel";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { GraphingToggle } from "@/components/ui/graphing-toggle";
import { useGraphingStore } from "@/store/graphing";

interface PlaygroundLayoutProps {
  sessionId: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

type Tab = "chat" | "preview" | "code";

const HERO_COLORS = ["#10B981", "#EAB308", "#3B82F6", "#EF4444", "#8B5CF6", "#F97316", "#06B6D4", "#6366F1"];

// ─── Share Popover ──────────────────────────────────────────────────────────
function SharePopover({
  onShare,
  onClose,
}: {
  onShare: (v: "private" | "link" | "public") => Promise<void>;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<"private" | "link" | "public">("private");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelect = async (v: "private" | "link" | "public") => {
    setSelected(v);
    setLoading(true);
    try {
      await onShare(v);
      if (v !== "private") {
        // The shareSession returns the URL — we'll get it from the response
        const res = await fetch(window.location.pathname.replace(/\/playground\/.*/, "") + "/api/sessions/" + window.location.pathname.split("/playground/")[1] + "/visibility", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visibility: v }),
        });
        // Actually the shareSession already did this, let's just pick the URL from it
      }
    } catch (err) {
      console.error("Share error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-64 bg-background border border-border z-50 font-mono shadow-xl">
      <div className="p-3 space-y-1">
        {(["private", "link", "public"] as const).map((v) => (
          <button
            key={v}
            onClick={() => handleSelect(v)}
            className={`w-full text-left px-3 py-2 transition-colors ${
              selected === v ? "text-foreground bg-foreground/5" : "text-muted hover:text-foreground"
            }`}
          >
            <div className="text-xs font-semibold capitalize">{v === "link" ? "Share link" : v}</div>
            <div className="text-[10px] text-muted opacity-80 mt-0.5">
              {v === "private" && "Only you can see this"}
              {v === "link" && "Anyone with the link"}
              {v === "public" && "Discoverable by everyone"}
            </div>
          </button>
        ))}
      </div>
      {shareUrl && selected !== "private" && (
        <div className="px-3 pb-3 flex gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent border border-border px-2 py-1 text-[10px] text-muted focus:outline-none"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="text-[10px] px-2 py-1 border border-border text-muted hover:text-foreground transition-colors"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function PlaygroundLayout({ sessionId }: PlaygroundLayoutProps) {
  const [heroColor, setHeroColor] = useState("#10B981");
  const [started, setStarted] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [isMobile, setIsMobile] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [currentVisibility, setCurrentVisibility] = useState<"private" | "link" | "public">("private");
  
  const isGraphingEnabled = useGraphingStore((s) => s.isGraphingEnabled);
  const toggleGraphing = useGraphingStore((s) => s.toggleGraphing);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const messages = useAgentStore((s) => s.messages);
  const isStreaming = useAgentStore((s) => s.isStreaming || s.status === "thinking" || s.status === "writing");
  const isReadOnly = useSessionStore((s) => s.isReadOnly);
  
  const { 
    submitIntent, 
    reigniteSession, 
    shareSession, 
    sessionIdRef
  } = useOrchestrator();

  useEffect(() => {
    setHeroColor(HERO_COLORS[Math.floor(Math.random() * HERO_COLORS.length)]);
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset state for new sessions - use setTimeout to break update cycle
  useEffect(() => {
    if (sessionId === "new") {
      // Use setTimeout to break the synchronous update cycle
      setTimeout(() => {
        useAgentStore.getState().reset();
        useOutputStore.getState().reset();
        useSessionStore.getState().resetSession();
        setStarted(false);
      }, 0);
    }
  }, [sessionId]);

  // Reignite existing session on mount
  useEffect(() => {
    if (sessionId && sessionId !== "new") {
      setStarted(true);
      reigniteSession(sessionId);
    }
  }, [sessionId, reigniteSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming) return;

    if (!started) {
      setStarted(true);
    }

    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await submitIntent(trimmed, "browser");
  }, [inputValue, isStreaming, started, submitIntent]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleManualSend = async (val: string) => {
    if (!val.trim() || isStreaming) return;
    
    if (!started) {
      setStarted(true);
    }

    await submitIntent(val.trim(), "browser");
  };

  const handleShare = async (visibility: "private" | "link" | "public") => {
    try {
      const result = await shareSession(visibility);
      setCurrentVisibility(visibility);
      if (visibility !== "private" && result.shareUrl) {
        setShareUrl(result.shareUrl);
      } else {
        setShareUrl(null);
      }
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  // Removed inline ChatPanel

  // Share button for the status bar area
  const ShareButton = () => (
    <div className="relative">
      <button
        onClick={() => setShowShare(!showShare)}
        className="text-[11px] font-mono text-zinc-500 hover:text-foreground px-3 py-1 border border-border hover:border-zinc-400 transition-colors"
      >
        Share
      </button>
      {showShare && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border z-50 font-mono shadow-2xl">
          <div className="p-3 space-y-1">
            {(["private", "link", "public"] as const).map((v) => (
              <button
                key={v}
                onClick={() => handleShare(v)}
                className={`w-full text-left px-3 py-2 transition-colors ${
                  currentVisibility === v ? "text-foreground bg-foreground/5" : "text-muted hover:text-foreground"
                }`}
              >
                <div className="text-xs font-semibold capitalize">{v === "link" ? "Share link" : v}</div>
                <div className="text-[10px] text-muted opacity-80 mt-0.5">
                  {v === "private" && "Only you can see this"}
                  {v === "link" && "Anyone with the link"}
                  {v === "public" && "Discoverable by everyone"}
                </div>
              </button>
            ))}
          </div>
          {shareUrl && currentVisibility !== "private" && (
            <div className="px-3 pb-3 border-t border-border pt-3">
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent border border-border px-2 py-1 text-[10px] text-muted focus:outline-none min-w-0"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                  }}
                  className="text-[10px] px-2 py-1 border border-border text-muted hover:text-foreground transition-colors whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const ImportToCompilerButton = () => {
    const router = useRouter();
    const currentCode = useAgentStore((s) => s.code);
    const { setUserCode, setSessionId, resetChat } = useCompilerStore();

    const handleImport = () => {
      resetChat();
      setUserCode(currentCode);
      setSessionId(null);
      router.push("/compiler");
    };

    return (
      <button
        onClick={handleImport}
        className="text-[11px] font-mono text-[#f97316] hover:text-[#fb923c] px-3 py-1 border border-[#f9731633] hover:border-[#f9731666] transition-colors"
      >
        Import to Compiler →
      </button>
    );
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background text-foreground flex flex-col md:flex-row">
      <AnimatePresence mode="wait">
        {!started ? (
          <motion.div 
            key="initial-chat-box"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-50 h-full w-full flex flex-col items-center justify-center p-4 md:p-8 bg-background overflow-y-auto">
            <HeroDitheringCard
              title="FORGE"
              description="What do you want to build?"
              colorFront={heroColor}
              className="w-full max-w-[95%] lg:max-w-6xl"
              titleClassName="font-comico text-5xl md:text-6xl lg:text-[72px] text-white mb-4 leading-none mt-0 text-center"
              minHeight="min-h-[300px] md:min-h-[360px]"
            >
              <div className="w-full max-w-[900px] px-4">
                {/* Graphing Toggle - Prominent Position */}
                <div className="mb-4 flex justify-center">
                  <GraphingToggle 
                    isEnabled={isGraphingEnabled}
                    onToggle={toggleGraphing}
                  />
                </div>
                
                <div className="relative border border-foreground/10 rounded-2xl bg-foreground/5 backdrop-blur-3xl focus-within:border-foreground/20 transition-all duration-300 shadow-2xl group/input min-h-[160px] flex flex-col">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your request..."
                    rows={1}
                    className="w-full bg-transparent text-foreground px-6 py-6 text-[15px] md:text-[16px] font-mono font-light placeholder:font-mono placeholder:font-light placeholder:text-foreground/30 focus:outline-none resize-none leading-relaxed flex-1"
                  />
                  
                  <div className="flex items-center justify-between px-4 pb-4">
                    <button className="p-2.5 rounded-xl hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-colors duration-200">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSend}
                      disabled={!inputValue.trim()}
                      className="bg-[#222222] hover:bg-[#2a2a2a] disabled:opacity-20 text-white p-3 rounded-xl transition-all duration-200 shadow-sm border border-white/5"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 7-7 7 7M12 19V5" />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                <div className="hidden md:flex gap-3 mt-6 justify-center flex-wrap">
                  {[
                    "Build a linear regression model",
                    "Create a K-means clustering visualizer",
                    "Make a decision tree classifier",
                  ].map((suggestion) => (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={suggestion}
                      onClick={() => {
                        setInputValue(suggestion);
                        textareaRef.current?.focus();
                      }}
                      className="text-xs font-mono font-light text-foreground/50 border border-foreground/10 rounded-full px-4 py-2 hover:border-foreground hover:text-foreground transition-colors duration-150 backdrop-blur-sm bg-foreground/5"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </div>
            </HeroDitheringCard>
          </motion.div>
        ) : (
          <motion.div 
            key="active-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="absolute inset-0 h-full w-full flex flex-col md:flex-row overflow-hidden">
            
            {isMobile ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-hidden relative">
                  {activeTab === "chat" && (
                    <ChatPanel 
                      sessionId={sessionId} 
                      isMobile={true} 
                      handleSend={handleManualSend}
                      inputValue={inputValue}
                      setInputValue={setInputValue}
                    />
                  )}
                  {activeTab === "preview" && (
                    <div className="h-full w-full bg-white overflow-y-auto">
                      <RightPanel sessionId={sessionId} />
                    </div>
                  )}
                  {activeTab === "code" && (
                    <div className="h-full w-full bg-surface">
                      <CenterPanel sessionId={sessionId} />
                    </div>
                  )}
                </div>

                {/* Mobile Tab Bar */}
                <div className="h-16 border-t border-border bg-surface flex items-center justify-around px-4 shrink-0">
                  <button
                    onClick={() => setActiveTab("chat")}
                    className={cn(
                      "flex flex-col items-center gap-1 transition-colors duration-200",
                      activeTab === "chat" ? "text-primary" : "text-muted"
                    )}
                  >
                    <div className="w-5 h-5 border border-current rounded-sm flex items-center justify-center font-mono text-[10px] font-bold">F</div>
                    <span className="text-[10px] font-mono uppercase tracking-tighter">Chat</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={cn(
                      "flex flex-col items-center gap-1 transition-colors duration-200",
                      activeTab === "preview" ? "text-primary" : "text-muted"
                    )}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    <span className="text-[10px] font-mono uppercase tracking-tighter">Preview</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("code")}
                    className={cn(
                      "flex flex-col items-center gap-1 transition-colors duration-200",
                      activeTab === "code" ? "text-primary" : "text-muted"
                    )}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                    <span className="text-[10px] font-mono uppercase tracking-tighter">Code</span>
                  </button>
                  {!isReadOnly && (
                    <div className="flex flex-col items-center gap-1">
                      <ShareButton />
                    </div>
                  )}
                  <ThemeToggle className="scale-75 origin-center" />
                </div>
              </div>
            ) : (
              <>
                <ResizablePanelGroup direction="horizontal" className="flex-1 w-full">
                  <ResizablePanel defaultSize={30} minSize={20} collapsible={true}>
                    <ChatPanel 
                      sessionId={sessionId} 
                      handleSend={handleManualSend}
                      inputValue={inputValue}
                      setInputValue={setInputValue}
                    />
                  </ResizablePanel>
                  
                  <ResizableHandle withHandle className="bg-white/5 hover:bg-white/10 transition-colors" />
                  
                  <ResizablePanel defaultSize={55} minSize={30}>
                    <div className="h-full w-full bg-white relative overflow-hidden">
                      {/* Share and Import buttons overlay */}
                      {!isReadOnly && (
                        <div className="absolute top-2 right-2 z-30 flex items-center gap-2">
                          <ImportToCompilerButton />
                          <ShareButton />
                        </div>
                      )}
                      <RightPanel sessionId={sessionId} />
                    </div>
                  </ResizablePanel>
                  
                  <ResizableHandle withHandle className="bg-white/5 hover:bg-white/10 transition-colors" />
                  
                  <ResizablePanel defaultSize={15} minSize={10} collapsible={true}>
                    <div className="h-full bg-surface shadow-[-20px_0_30px_-15px_rgba(0,0,0,0.5)] border-l border-white/5">
                      <CenterPanel sessionId={sessionId} />
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
