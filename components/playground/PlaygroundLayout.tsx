"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import CenterPanel from "./CenterPanel";
import RightPanel from "./RightPanel";
import { useAgentStore } from "@/store/agent";
import { HeroDitheringCard } from "@/components/ui/hero-dithering-card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useOrchestrator } from "@/hooks/useOrchestrator";

interface PlaygroundLayoutProps {
  sessionId: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

type Tab = "chat" | "preview" | "code";

export default function PlaygroundLayout({ sessionId }: PlaygroundLayoutProps) {
  const [started, setStarted] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [isMobile, setIsMobile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const messages = useAgentStore((s) => s.messages);
  const isStreaming = useAgentStore((s) => s.isStreaming || s.status === "thinking" || s.status === "writing");
  
  const { submitIntent } = useOrchestrator();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const ChatPanel = () => (
    <div className={cn("flex flex-col h-full bg-surface border-r border-border z-10", isMobile ? "w-full" : "w-[320px] min-w-[320px]")}>
      <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0 bg-surface/80 backdrop-blur-sm">
        <span className="font-comico text-3xl tracking-tight text-primary mt-1">FORGE</span>
        <span className="text-[10px] font-mono font-light text-muted">
          {sessionId.slice(0, 8)}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
        {messages.map((msg: Message, i: number) => (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            key={i} 
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-mono font-bold ${
                msg.role === "user"
                  ? "bg-white text-black"
                  : "bg-primary/20 text-primary border border-primary/30"
              }`}
            >
              {msg.role === "user" ? "Y" : "F"}
            </div>
            <div className="min-w-0 pt-0.5">
              <div className={`p-3 rounded-2xl max-w-[100%] text-[13px] font-mono leading-relaxed shadow-sm
                ${msg.role === "user" 
                  ? "bg-white text-black rounded-tr-sm" 
                  : "bg-surface border border-white/5 text-placeholder rounded-tl-sm"}`}
              >
                {msg.content}
              </div>
            </div>
          </motion.div>
        ))}
        {isStreaming && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-mono font-bold bg-primary/20 text-primary border border-primary/30">
              F
            </div>
            <div className="pt-1">
              <div className="flex gap-1 p-3 rounded-2xl bg-surface border border-white/5 rounded-tl-sm">
                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4 }} className="w-1.5 h-1.5 bg-placeholder rounded-full" />
                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }} className="w-1.5 h-1.5 bg-placeholder rounded-full" />
                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.4 }} className="w-1.5 h-1.5 bg-placeholder rounded-full" />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/5 p-4 shrink-0 bg-surface z-20">
        <div className="relative border border-white/10 rounded-xl bg-[#111111]/80 backdrop-blur-xl focus-within:border-white/20 transition-all duration-300 shadow-lg flex flex-col min-h-[100px]">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type your request..."
            rows={1}
            disabled={isStreaming}
            className="w-full bg-transparent text-white px-4 py-4 text-[13px] font-mono font-light placeholder:font-mono placeholder:font-light placeholder:text-zinc-500 focus:outline-none resize-none disabled:opacity-40 flex-1"
          />
          <div className="flex items-center justify-between px-3 pb-3">
            <button className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 transition-colors duration-200">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!inputValue.trim() || isStreaming}
              className="bg-[#222222] hover:bg-[#2a2a2a] disabled:opacity-20 text-white p-2 rounded-lg transition-all duration-200 shadow-sm border border-white/5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 7-7 7 7M12 19V5" />
              </svg>
            </motion.button>
          </div>
        </div>
        {!isMobile && (
          <div className="text-[10px] font-light text-muted font-mono mt-1.5 px-1">
            Enter to send · Shift+Enter for new line
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black flex flex-col md:flex-row">
      <AnimatePresence mode="wait">
        {!started ? (
          <motion.div 
            key="initial-chat-box"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-50 h-full w-full flex flex-col items-center justify-center p-4 md:p-8 bg-black overflow-y-auto">
            <HeroDitheringCard
              title="FORGE"
              description="What do you want to build?"
              colorFront="#10B981"
              className="w-full max-w-[95%] lg:max-w-6xl"
              titleClassName="font-comico text-5xl md:text-6xl lg:text-[72px] text-white mb-4 leading-none mt-0 text-center"
              minHeight="min-h-[300px] md:min-h-[360px]"
            >
              <div className="w-full max-w-[900px] px-4">
                <div className="relative border border-white/10 rounded-2xl bg-[#111111]/60 backdrop-blur-xl focus-within:border-white/20 transition-all duration-300 shadow-2xl group/input min-h-[160px] flex flex-col">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your request..."
                    rows={1}
                    className="w-full bg-transparent text-white px-6 py-6 text-[15px] md:text-[16px] font-mono font-light placeholder:font-mono placeholder:font-light placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed flex-1"
                  />
                  
                  <div className="flex items-center justify-between px-4 pb-4">
                    <button className="p-2.5 rounded-xl hover:bg-white/5 text-zinc-400 transition-colors duration-200">
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
                      className="text-xs font-mono font-light text-muted border border-border rounded-full px-4 py-2 hover:border-white hover:text-white transition-colors duration-150 backdrop-blur-sm bg-black/30"
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
                  {activeTab === "chat" && <ChatPanel />}
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
                </div>
              </div>
            ) : (
              <>
                <ChatPanel />
                <div className="flex-1 min-w-0 border-r border-border z-0 bg-white">
                  <RightPanel sessionId={sessionId} />
                </div>
                <div className="w-[400px] min-w-[350px] shrink-0 bg-surface z-10 shadow-[-20px_0_30px_-15px_rgba(0,0,0,0.5)]">
                  <CenterPanel sessionId={sessionId} />
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
