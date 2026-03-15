"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserButton, SignOutButton } from "@/lib/auth";
import { MorphingSquare } from "@/components/ui/morphing-square";
import { TextEffect } from "@/components/ui/text-effect";
import { useAgentStore } from "@/store/agent";
import { useSessionStore } from "@/store/session";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  sessionId: string;
  isMobile?: boolean;
  handleSend: (value: string) => Promise<void>;
  inputValue: string;
  setInputValue: (value: string) => void;
}

export default function ChatPanel({ 
  sessionId, 
  isMobile, 
  handleSend, 
  inputValue, 
  setInputValue 
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const messages = useAgentStore((s) => s.messages);
  const isStreaming = useAgentStore((s) => s.isStreaming || s.status === "thinking" || s.status === "writing" || s.status === "fixing");
  const isReadOnly = useSessionStore((s) => s.isReadOnly);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const onInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed && !isStreaming) {
        handleSend(trimmed);
        setInputValue("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    }
  };

  const onSubmit = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !isStreaming) {
      handleSend(trimmed);
      setInputValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-surface border-r border-border z-10 w-full")}>
      <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0 bg-surface/80 backdrop-blur-sm">
        <span className="font-comico text-3xl tracking-tight text-primary mt-1">FORGE</span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono font-light text-muted">
            {sessionId.slice(0, 8)}
          </span>
          <SignOutButton />
          <UserButton />
        </div>
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
                  : "bg-black text-white border border-white/20"
              }`}
            >
              {msg.role === "user" ? "Y" : "F"}
            </div>
            <div className="min-w-0 pt-0.5">
              <div className={`p-3 rounded-2xl max-w-[100%] text-[13px] font-mono leading-relaxed shadow-sm
                ${msg.role === "user" 
                  ? "bg-black border border-white/20 text-white rounded-tr-sm" 
                  : "bg-black border border-white/20 text-white rounded-tl-sm"}`}
              >
                <TextEffect per="word" preset="blur">
                  {msg.content}
                </TextEffect>
              </div>
            </div>
          </motion.div>
        ))}
        {isStreaming && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-mono font-bold bg-black text-white border border-white/20">
              F
            </div>
            <div className="pt-1">
              <div className="flex items-center p-3 rounded-2xl bg-black border border-white/20 rounded-tl-sm">
                <MorphingSquare className="w-3 h-3 bg-white" />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isReadOnly && (
        <div className="border-t border-white/5 p-4 shrink-0 bg-surface z-20">
          <div className="relative border border-white/10 rounded-xl bg-[#111111]/80 backdrop-blur-xl focus-within:border-white/20 transition-all duration-300 shadow-lg flex flex-col min-h-[100px]">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
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
                onClick={onSubmit}
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
      )}

      {isReadOnly && (
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-[10px] font-mono text-zinc-600 text-center">
            View-only · No edit controls
          </p>
        </div>
      )}
    </div>
  );
}
