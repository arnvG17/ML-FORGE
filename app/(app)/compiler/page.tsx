"use client";

import { useEffect, useRef, useState, useCallback, KeyboardEvent, Suspense } from "react";
import { useCompilerStore } from "@/store/compiler";
import { useCompilerOrchestrator } from "@/hooks/useCompilerOrchestrator";
import { getPyodide } from "@/lib/pyodide-runner";
import { SignOutButton } from "@/lib/auth";
import { keyManager } from "@/lib/llmKeyManager";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import useSWR from "swr";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sparkles, Terminal, Play, Save, ChevronLeft, Layout, Cpu } from "lucide-react";
import PlotViewer from "@/components/playground/PlotViewer";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TextEffect } from "@/components/ui/text-effect";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ═══════════════════════════════════════════════════════════════════
// Compiler Content (Wrapped in Suspense below)
// ═══════════════════════════════════════════════════════════════════

function CompilerContent() {
  const {
    pyodideStatus,
    userCode,
    setUserCode,
    sessionId,
    setSessionId,
    window1Output,
    variables,
    chatHistory,
    isGenerating,
    isExecutingAI,
    proposedCode,
    pendingDiff,
    diffStats,
    setPyodideStatus,
    setProposedCode,
  } = useCompilerStore();

  const [editor, setEditor] = useState<any>(null);
  const [monaco, setMonaco] = useState<any>(null);
  const { runUserCode, submitChat, acceptDiff, rejectDiff, loadExample } = useCompilerOrchestrator(editor, monaco);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [runTime, setRunTime] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Load session if ID in URL ──────────────────────────────────
  const urlId = searchParams.get("id");
  const { data: sessionData } = useSWR(urlId ? `/api/sessions/${urlId}` : null, fetcher);

  useEffect(() => {
    if (sessionData && !sessionId) {
      setSessionId(sessionData.sessionId);
      setUserCode(sessionData.currentCode?.full || "");
    }
  }, [sessionData, sessionId, setSessionId, setUserCode]);

  // ── Save handler ───────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        name: userCode.slice(0, 30).split("\n")[0] || "Untitled Compiler",
        currentCode: { full: userCode, extractedML: "", version: 1 },
        sessionMode: "compiler",
      };

      if (sessionId) {
        await fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetch("/api/sessions", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.sessionId) {
          setSessionId(data.sessionId);
          router.replace(`/compiler?id=${data.sessionId}`);
        }
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Global keyboard shortcuts ───────────────────────────────────
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      // Ctrl/Cmd + K to focus chat input from anywhere
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
      // Ctrl/Cmd + / to clear chat
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        const state = useCompilerStore.getState();
        state.resetChat();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // ── Load chat history from session on mount ───────────────────────
  useEffect(() => {
    const { loadChatFromSession } = useCompilerStore.getState();
    loadChatFromSession();
  }, []);

  // ── Auto-save chat to session when it changes ────────────────────
  useEffect(() => {
    const { saveChatToSession } = useCompilerStore.getState();
    saveChatToSession();
  }, [chatHistory]);

  // ── Load Pyodide on mount ──────────────────────────────────────
  useEffect(() => {
    setPyodideStatus("loading");
    getPyodide()
      .then(() => setPyodideStatus("ready"))
      .catch(() => setPyodideStatus("error"));
  }, [setPyodideStatus]);

  // ── Auto-scroll AI thread ─────────────────────────────────────
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [chatHistory, isGenerating]);

  // ── Run handler ────────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (pyodideStatus !== "ready") return;
    const start = Date.now();
    setRunTime(null);
    await runUserCode();
    setRunTime(Math.round((Date.now() - start) / 100) / 10);
  }, [pyodideStatus, runUserCode]);

  // ── Chat submit ────────────────────────────────────────────────
  const handleChatSubmit = useCallback(
    (text?: string) => {
      const msg = text || chatInput.trim();
      if (!msg || isGenerating) return;
      setChatInput("");
      submitChat(msg);
    },
    [chatInput, isGenerating, submitChat]
  );

  // ── Chat textarea key handler ──────────────────────────────────
  const handleChatKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleChatSubmit();
    }
    // Escape to clear input
    if (e.key === "Escape") {
      e.preventDefault();
      setChatInput("");
      textareaRef.current?.blur();
    }
    // Ctrl/Cmd + K to focus chat
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      textareaRef.current?.focus();
    }
  };

  // ── Textarea auto-grow ─────────────────────────────────────────
  const handleChatInputChange = (val: string) => {
    setChatInput(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col font-mono">
      {/* ── TOPBAR ─────────────────────────────────────────────── */}
      <div className="h-10 border-b border-border flex items-center justify-between px-4 shrink-0 bg-surface/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-muted hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mr-2">FORGE COMPILER</span>
          {sessionId && (
             <span className="text-[10px] text-muted-foreground px-2 py-0.5 border border-border rounded uppercase">ID: {sessionId.slice(0, 8)}</span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted hover:text-foreground transition-colors"
          >
            <Save className="w-3 h-3" />
            {isSaving ? "Saving..." : "Save"}
          </button>
          <SignOutButton />
        </div>
      </div>

      {/* ── MAIN RESIZABLE LAYOUT ───────────────────────────────── */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* PANEL 1: AI TUTOR (LEFT) */}
        <ResizablePanel defaultSize={25} minSize={20} collapsible={true} className="flex flex-col bg-surface/20">
          <div className="h-full flex flex-col overflow-hidden">
            <div className="h-9 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background/40">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest text-[#f97316]">AI TUTOR</span>
                {(isGenerating || isExecutingAI) && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse" />
                )}
              </div>
              <div className="text-[8px] text-muted-foreground opacity-60 flex items-center gap-2">
                <kbd className="px-1 py-0.5 bg-border rounded">Ctrl+K</kbd> focus • <kbd className="px-1 py-0.5 bg-border rounded">Ctrl+/</kbd> clear
                <span className="text-[#f97316]">•</span>
                <span className="text-[#f97360]">Groq: {keyManager.getTotalKeys()} keys</span>
              </div>
            </div>

            {/* Examples row */}
            <div className="shrink-0 border-b border-border/50 p-3 bg-background/20">
              <div className="text-[9px] text-muted-foreground uppercase tracking-tighter mb-2">Start from example</div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["ml", "ML model"],
                    ["sorting", "Sorting"],
                    ["pandas", "Pandas"],
                    ["recursion", "Recursion"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => loadExample(key)}
                    className="text-[9px] text-muted-foreground hover:text-foreground border border-border hover:border-foreground/40 px-2 py-1 transition-all rounded"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI thread */}
            <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
              {chatHistory.length === 0 ? (
                <div className="text-[11px] text-muted-foreground/60 leading-relaxed italic font-light">
                  Run your code and I&apos;ll explain the execution trace.
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div key={msg.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground opacity-50">
                        {msg.role === "user" ? "YOU" : "AI"}
                       </span>
                    </div>

                    {msg.role === "user" ? (
                      <div className="text-[12px] text-zinc-400 border-l border-zinc-700 pl-3 font-light">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {msg.text && (
                          <div className="text-[12px] text-zinc-400 border-l border-[#f97316]/30 pl-3 font-light">
                            <TextEffect per="word" preset="blur">
                              {msg.text}
                            </TextEffect>
                          </div>
                        )}
                        {msg.code && (
                          <div className="bg-black/40 border border-white/5 p-3 rounded-lg">
                            <pre className="text-[11px] text-zinc-500 font-mono font-light whitespace-pre-wrap leading-relaxed">
                              {msg.code}
                            </pre>
                            {msg.output && (
                               <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2">
                                  <Terminal className="w-3 h-3 text-zinc-600" />
                                  <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-tighter italic">
                                     {msg.output.error ? "failed" : "executed"}
                                  </span>
                               </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
              {isGenerating && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[#f97316]/10 border border-[#f97316]/20 rounded-lg w-fit">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-[#f97316] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-1 bg-[#f97316] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-1 bg-[#f97316] rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-[10px] text-[#f97316] font-bold uppercase tracking-widest">AI is thinking...</span>
                </div>
              )}
              {isExecutingAI && (
                <div className="text-[9px] text-[#f97316] animate-pulse uppercase tracking-widest px-3">
                  Running generated code...
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-border bg-background/40">
               <div className="relative group">
                 <textarea
                  ref={textareaRef}
                  value={chatInput}
                  onChange={(e) => handleChatInputChange(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  disabled={isGenerating}
                  placeholder="Ask a question..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 pr-12 text-xs text-zinc-400 font-light focus:outline-none focus:border-[#f97316]/50 placeholder:text-zinc-700 resize-none transition-all"
                  rows={2}
                 />
                 <button
                  onClick={() => handleChatSubmit()}
                  disabled={isGenerating || !chatInput.trim()}
                  className="absolute right-3 top-3 p-1.5 bg-zinc-800 hover:bg-[#f97316] text-white rounded-lg transition-all disabled:opacity-20 disabled:hover:bg-zinc-800"
                  aria-label="Send message"
                 >
                   <motion.div
                     whileHover={{ scale: 1.1 }}
                     whileTap={{ scale: 0.9 }}
                   >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 7-7 7 7M12 19V5" />
                    </svg>
                   </motion.div>
                 </button>
               </div>

               <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                  {["Explain logic", "Suggest additions", "Fix errors"].map(text => (
                    <button 
                      key={text} 
                      onClick={() => handleChatSubmit(text)}
                      className="text-[9px] text-zinc-600 hover:text-zinc-400 whitespace-nowrap transition-colors"
                    >
                      {text}
                    </button>
                  ))}
               </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-border/10 hover:bg-white/5 transition-colors" />

        {/* PANEL 2: EDITOR (CENTER) */}
        <ResizablePanel defaultSize={45} minSize={30} className="flex flex-col bg-[#050505]">
          <div className="h-full flex flex-col overflow-hidden">
            <div className="h-9 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background/40">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-blue-400" />
                <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Editor Workspace</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRun}
                  disabled={pyodideStatus !== "ready"}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white text-black rounded-full hover:bg-zinc-200 disabled:opacity-30 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)]"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span className="text-[9px] font-bold uppercase tracking-tighter">Run</span>
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 relative">
              {pendingDiff && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 diff-widget">
                  <div className="flex items-center gap-3 border-r border-white/10 pr-3">
                    <span className="text-[10px] font-bold text-[#f97316] uppercase tracking-[0.2em]">DIFF PENDING</span>
                    {diffStats && (
                      <div className="diff-stats text-[9px] font-mono">
                        <span className="added">+{diffStats.added}</span>
                        <span className="removed">-{diffStats.removed}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pl-3">
                    <button
                      onClick={acceptDiff}
                      className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-white text-black hover:bg-zinc-200 rounded-lg transition-all"
                    >
                      Accept
                    </button>
                    <button
                      onClick={rejectDiff}
                      className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              <Editor
                height="100%"
                language="python"
                theme="vs-dark"
                value={userCode}
                onChange={(val) => {
                  // Only allow edits if no diff is pending
                  if (!pendingDiff) {
                    setUserCode(val || "");
                  }
                }}
                onMount={(editor, monaco) => {
                  setEditor(editor);
                  setMonaco(monaco);
                  editor.addAction({
                    id: "run-code",
                    label: "Run Code",
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter], // Cmd+Enter
                    run: () => handleRun(),
                  });
                }}
                options={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  renderLineHighlight: "all",
                  readOnly: !!pendingDiff,
                  scrollbar: {
                    vertical: "hidden",
                    horizontal: "hidden",
                  },
                  overviewRulerLanes: 0,
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  padding: { top: 12 },
                }}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-border/10 hover:bg-white/5 transition-colors" />

        {/* PANEL 3: OUTPUT & PLOTS (RIGHT) */}
        <ResizablePanel defaultSize={30} minSize={20} collapsible={true} className="bg-background flex flex-col">
          <div className="h-full flex flex-col overflow-hidden">
            <div className="h-9 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background/50 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-orange-400" />
                <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Forge VM Output</span>
              </div>
              <span className="text-[9px] text-muted-foreground tracking-tighter">
                {pyodideStatus === "loading"
                  ? "BOOTING..."
                  : pyodideStatus === "running"
                  ? "RUNNING..."
                  : runTime
                  ? `DONE IN ${runTime}S`
                  : "READY"}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
              {/* Insight */}
              {window1Output && !window1Output.error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#f97316]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#f97316]">Execution Insight</span>
                  </div>
                  <div className="space-y-2">
                    {window1Output.stdout.map((line, i) => (
                      <div key={i} className="text-xs text-zinc-500 leading-relaxed font-mono pl-4 border-l border-white/10">
                        {line}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Error */}
              {window1Output?.error && (
                <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20">
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Runtime Error</div>
                  <pre className="text-[11px] text-red-300/70 whitespace-pre-wrap font-mono leading-relaxed bg-red-500/10 p-4 rounded-lg border border-red-500/10">
                    {window1Output.error}
                  </pre>
                </div>
              )}

              {/* Plots */}
              {window1Output?.plots.map((b64, i) => (
                <PlotViewer key={i} name={`Visualization ${i + 1}`} base64={b64} />
              ))}

              {/* Empty state */}
              {(!window1Output || (window1Output.stdout.length === 0 && window1Output.plots.length === 0 && !window1Output.error)) && pyodideStatus !== "loading" && (
                <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-20 select-none grayscale pt-10">
                  <Terminal size={48} strokeWidth={1} />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-center">Waiting for output</p>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* ── GLOBAL STYLES ───────────────────────────────────────── */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default function CompilerPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-[#444444] font-mono text-xs">Initializing...</div>}>
      <CompilerContent />
    </Suspense>
  );
}


