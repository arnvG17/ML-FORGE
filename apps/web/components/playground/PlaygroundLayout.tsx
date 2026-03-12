"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import CenterPanel from "./CenterPanel";
import RightPanel from "./RightPanel";
import { useAgentStore } from "@/store/agent";
import { HeroDitheringCard } from "@/components/ui/hero-dithering-card";
import { motion, AnimatePresence } from "framer-motion";

interface PlaygroundLayoutProps {
  sessionId: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function PlaygroundLayout({ sessionId }: PlaygroundLayoutProps) {
  const [started, setStarted] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const setCode = useAgentStore((s) => s.setCode);
  const setStatus = useAgentStore((s) => s.setStatus);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

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

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || isGenerating) return;

    if (!started) {
      setStarted(true);
    }

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Simulate agent response
    setIsGenerating(true);
    setStatus("writing");

    const demoCode = `# Generated for: ${trimmed}
import numpy as np
import json

# ── CONFIG ──────────────────────────
SAMPLES = 200
NOISE = 0.15
ALGORITHM = "linear_regression"

# ── DATA ────────────────────────────
np.random.seed(42)
X = np.linspace(0, 10, SAMPLES)
y = 2.5 * X + 1.8 + np.random.normal(0, NOISE * 10, SAMPLES)

# ── MODEL ───────────────────────────
coeffs = np.polyfit(X, y, 1)
predictions = np.polyval(coeffs, X)
residuals = y - predictions
mse = float(np.mean(residuals ** 2))
r_squared = float(1 - np.sum(residuals**2) / np.sum((y - np.mean(y))**2))

# ── OUTPUT ──────────────────────────
output = {
    "metrics": {
        "MSE": round(mse, 4),
        "R²": round(r_squared, 4),
        "Slope": round(float(coeffs[0]), 4),
        "Intercept": round(float(coeffs[1]), 4)
    },
    "plots": {},
    "controls": [
        {
            "id": "ctrl_samples",
            "type": "slider",
            "label": "Sample Size",
            "min": 50,
            "max": 500,
            "step": 10,
            "default": 200,
            "targets_var": "SAMPLES"
        },
        {
            "id": "ctrl_noise",
            "type": "slider",
            "label": "Noise Level",
            "min": 0.01,
            "max": 1.0,
            "step": 0.01,
            "default": 0.15,
            "targets_var": "NOISE"
        }
    ],
    "errors": []
}
print(json.dumps(output))
`;

    let i = 0;
    const interval = setInterval(() => {
      if (i < demoCode.length) {
        const chunkSize = Math.min(3, demoCode.length - i);
        setCode(demoCode.slice(0, i + chunkSize));
        i += chunkSize;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
        setStatus("done");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I've generated a linear regression model for you. The code is streaming in the editor — adjust the sliders on the right to experiment with parameters.",
          },
        ]);
      }
    }, 8);
  }, [inputValue, isGenerating, started, setCode, setStatus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black flex">
      <AnimatePresence mode="wait">
        {!started ? (
          <motion.div 
            key="initial-chat-box"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-50 h-full w-full flex flex-col items-center justify-center p-4 md:p-8 bg-black">
            <HeroDitheringCard
              title="FORGE"
              description="What do you want to build?"
              colorFront="#10B981"
              className="w-full max-w-3xl"
              titleClassName="font-comico text-5xl md:text-6xl lg:text-[72px] text-white mb-4 leading-none mt-0"
              minHeight="min-h-[360px]"
            >
              <div className="w-full max-w-[680px]">
                <div className="relative border border-border rounded-lg bg-black/50 backdrop-blur-sm focus-within:border-white transition-colors duration-200 shadow-2xl">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe what you want to build..."
                    rows={1}
                    className="w-full bg-transparent text-white px-5 py-4 pr-14 text-[15px] font-light placeholder:font-light placeholder:text-placeholder focus:outline-none resize-none leading-relaxed"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center rounded bg-white text-black disabled:opacity-20 disabled:bg-muted transition-colors duration-150 shadow-sm"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.button>
                </div>

                <div className="flex gap-3 mt-6 justify-center flex-wrap">
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
            className="absolute inset-0 h-full w-full flex overflow-hidden">
            
            {/* Left: Chat Panel */}
            <div className="w-[320px] min-w-[320px] h-full flex flex-col bg-surface border-r border-border z-10 shadow-2xl">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0 bg-surface/80 backdrop-blur-sm">
                <span className="font-bebas text-3xl tracking-tight text-primary mt-1">FORGE</span>
                <span className="text-[10px] font-mono font-light text-muted">
                  {sessionId.slice(0, 8)}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
                {messages.map((msg, i) => (
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
                      <div className={`p-3 rounded-2xl max-w-[100%] text-[13px] leading-relaxed shadow-sm
                        ${msg.role === "user" 
                          ? "bg-white text-black rounded-tr-sm" 
                          : "bg-surface border border-white/5 text-placeholder rounded-tl-sm"}`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isGenerating && (
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

              {/* Chat Input */}
              <div className="border-t border-border p-3 shrink-0 bg-surface z-20">
                <div className="relative border border-border rounded-lg bg-black focus-within:border-primary/50 transition-colors duration-200">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Follow up..."
                    rows={1}
                    disabled={isGenerating}
                    className="w-full bg-transparent text-white px-4 py-3 pr-12 text-sm font-light placeholder:font-light placeholder:text-placeholder focus:outline-none resize-none disabled:opacity-40"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isGenerating}
                    className="absolute right-2 bottom-2 w-7 h-7 flex items-center justify-center rounded bg-white text-black disabled:opacity-20 disabled:bg-muted transition-colors duration-150"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.button>
                </div>
                <div className="text-[10px] font-light text-muted font-mono mt-1.5 px-1">
                  Enter to send · Shift+Enter for new line
                </div>
              </div>
            </div>

            {/* Center: Sandbox/Interface */}
            <div className="flex-1 min-w-0 border-r border-border z-0 bg-white">
              <RightPanel sessionId={sessionId} />
            </div>

            {/* Right: Code Editor */}
            <div className="w-[400px] min-w-[350px] shrink-0 bg-surface z-10 shadow-[-20px_0_30px_-15px_rgba(0,0,0,0.5)]">
              <CenterPanel sessionId={sessionId} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
