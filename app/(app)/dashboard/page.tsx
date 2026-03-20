"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { HeroDitheringCard } from "@/components/ui/hero-dithering-card";
import { UserButton, SignOutButton } from "@/lib/auth";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Edit2, Globe, Lock, Trash2, Check, X, Heart, MessageSquare, Star, Send } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function timeAgo(dateStr: string): string {
  if (!dateStr) return "recently";
  const now = Date.now();
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "recently";
  const then = date.getTime();
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
  const { mutate } = useSWRConfig();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(session.name || "Untitled");
  const [isSaving, setIsSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const accuracy = session.lastMetrics?.Accuracy;
  const version = session.currentCode?.version;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRename = async () => {
    if (newName === session.name) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await fetch(`/api/sessions/${session.sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: newName }),
      });
      mutate("/api/sessions");
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to rename session", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVisibilityChange = async (visibility: string) => {
    setIsSaving(true);
    try {
      await fetch(`/api/sessions/${session.sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({ visibility }),
      });
      mutate("/api/sessions");
      setShowMenu(false);
    } catch (err) {
      console.error("Failed to change visibility", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    try {
      await fetch(`/api/sessions/${session.sessionId}`, {
        method: "DELETE",
      });
      mutate("/api/sessions");
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

  const isCompiler = session.sessionMode === "compiler";
  const accentColor = isCompiler ? "#f97316" : "#3b82f6";
  const isPublic = session.visibility === "public";
  const visibilityColor = isPublic ? "#22c55e" : "#ef4444"; // Green for public, red for private

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-background p-8 group hover:bg-elevated/50 transition-all duration-500 rounded-sm hover:shadow-2xl hover:shadow-black/[0.01] dark:hover:shadow-white/[0.01] relative"
      style={{
        border: `1px solid ${isCompiler ? "rgba(249, 115, 22, 0.2)" : "rgba(59, 130, 246, 0.2)"}`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                className="bg-background border px-2 py-1 text-sm font-mono text-foreground w-full focus:outline-none"
                style={{ borderColor: accentColor }}
              />
              <button onClick={handleRename} className="text-muted hover:text-foreground">
                <Check size={14} />
              </button>
              <button onClick={() => setIsEditing(false)} className="text-muted hover:text-foreground">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="font-mono text-xl font-medium text-foreground truncate">
              {session.name || "Untitled"}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 border"
            style={{ borderColor: `${visibilityColor}33`, color: visibilityColor }}
          >
            {isCompiler ? "COMPILER" : (isPublic ? "PUBLIC" : "PRIVATE")}
          </span>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-muted hover:text-foreground transition-colors"
            >
              <MoreVertical size={16} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  className="absolute right-0 mt-2 w-40 bg-background border border-border shadow-2xl z-50 py-1"
                >
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-muted hover:bg-foreground/5 hover:text-foreground transition-colors"
                  >
                    <Edit2 size={12} /> Rename
                  </button>
                  <button
                    onClick={() => handleVisibilityChange(session.visibility === "public" ? "private" : "public")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-muted hover:bg-foreground/5 hover:text-foreground transition-colors"
                  >
                    {session.visibility === "public" ? (
                      <>
                        <Lock size={12} /> Make Private
                      </>
                    ) : (
                      <>
                        <Globe size={12} /> Make Public
                      </>
                    )}
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-red-500/70 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="text-[10px] font-mono text-muted/60 uppercase tracking-widest mb-4">
        {session.lastOpenedAt ? timeAgo(session.lastOpenedAt) : "—"}
      </div>
      <div className="flex items-center gap-3 mb-4">
        {accuracy !== undefined && (
          <span className="text-[10px] font-mono text-muted">
            Acc: {typeof accuracy === "number" ? (accuracy * 100).toFixed(1) + "%" : accuracy}
          </span>
        )}
        {version && (
          <span className="text-[10px] font-mono text-muted opacity-60">v{version}</span>
        )}
      </div>
      <Link
        href={isCompiler ? `/compiler?id=${session.sessionId}` : `/playground/${session.sessionId}`}
        className={`text-[10px] font-mono uppercase tracking-widest hover:underline transition-colors inline-flex items-center gap-2 group/link px-3 py-1.5 border rounded ${
          isCompiler 
            ? "text-orange-400 border-orange-400/30 hover:border-orange-400/50 hover:bg-orange-400/5" 
            : "text-blue-400 border-blue-400/30 hover:border-blue-400/50 hover:bg-blue-400/5"
        }`}
      >
        {isCompiler ? "Open in Compiler" : "Reignite"} <span className="group-hover/link:translate-x-1 transition-transform duration-300">→</span>
      </Link>
    </motion.div>
  );
}

function GalleryCard({ session, onOpenSocial }: { session: any, onOpenSocial: (s: any) => void }) {
  const likesCount = session.likes?.length || 0;
  const rating = session.rating || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background border-b border-border p-10 group hover:bg-elevated/40 transition-all duration-700 flex flex-col h-full relative"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden shrink-0">
          {session.creatorImage ? (
            <img src={session.creatorImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] font-mono text-muted">{(session.creatorName || "Anonymous")[0]}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-foreground/90 truncate">
            {session.creatorName || "Anonymous Creator"}
          </div>
          <div className="text-[10px] font-mono text-muted">
            {session.updatedAt ? timeAgo(session.updatedAt) : "Recently"}
          </div>
        </div>
      </div>

      <Link href={`/p/${session.shareToken}`} className="flex-1 min-h-0">
        <div className="text-2xl md:text-3xl font-mono font-medium text-foreground mb-3 leading-tight group-hover:text-primary transition-colors">
          {session.name || "Untitled"}
        </div>
        {session.intent && (
          <p className="text-[13px] font-sans text-muted mb-6 line-clamp-2 leading-relaxed opacity-80">
            {session.intent}
          </p>
        )}
      </Link>

      <div className="flex items-center justify-between pt-6 mt-auto">
        <div className="flex items-center gap-6">
          <button
            onClick={(e) => { e.preventDefault(); onOpenSocial(session); }}
            className="flex items-center gap-2 text-muted hover:text-foreground transition-all group/btn"
          >
            <Heart size={14} className={`${likesCount > 0 ? "text-red-500 fill-red-500" : "group-hover/btn:scale-110"}`} />
            <span className="text-[10px] font-mono uppercase tracking-tighter">{likesCount}</span>
          </button>
          
          <button
            onClick={(e) => { e.preventDefault(); onOpenSocial(session); }}
            className="flex items-center gap-2 text-muted hover:text-foreground transition-all group/btn"
          >
            <MessageSquare size={14} className="group-hover/btn:scale-110" />
            <span className="text-[10px] font-mono uppercase tracking-tighter">Discuss</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
           {session.forkCount > 0 && (
            <span className="text-[10px] font-mono text-muted/50 uppercase tracking-widest">
              {session.forkCount} forks
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SocialModal({ session, onClose, onUpdate }: { session: any, onClose: () => void, onUpdate: () => void }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [userLiked, setUserLiked] = useState(false);

  useEffect(() => {
    fetchComments();
    // In a real app we'd check if user liked via API or passed in props
  }, [session.sessionId]);

  const fetchComments = async () => {
    const res = await fetch(`/api/sessions/${session.sessionId}/social`);
    const data = await res.json();
    setComments(data.comments || []);
    setUserLiked(data.userLiked || false);
  };

  const handleLike = async () => {
    setIsLiking(true);
    try {
      const res = await fetch(`/api/sessions/${session.sessionId}/social`, {
        method: "POST",
        body: JSON.stringify({ action: "like" }),
      });
      const data = await res.json();
      setUserLiked(data.liked);
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    setIsCommenting(true);
    try {
      const res = await fetch(`/api/sessions/${session.sessionId}/social`, {
        method: "POST",
        body: JSON.stringify({ action: "comment", text: newComment }),
      });
      if (res.ok) {
        setNewComment("");
        fetchComments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleRate = async (rating: number) => {
    try {
      await fetch(`/api/sessions/${session.sessionId}/social`, {
        method: "POST",
        body: JSON.stringify({ action: "rate", rating }), // We'll add 'rate' action to API
      });
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-950 border border-white/10 w-full max-w-2xl h-[85vh] flex flex-col shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden rounded-sm"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-zinc-950/50">
          <div>
            <h2 className="text-2xl font-bold font-mono text-white tracking-tight">{session.name || "Untitled"}</h2>
            <div className="flex items-center gap-2 mt-1.5 px-2 py-0.5 bg-white/5 border border-white/5 w-fit">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Community Discussion</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 space-y-12">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex flex-col items-center justify-center gap-3 p-6 border transition-all duration-300 group ${
                  userLiked 
                    ? "bg-red-500/5 border-red-500/20 text-red-500" 
                    : "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/10 hover:text-white"
                }`}
              >
                <div className="relative">
                  <Heart size={28} className={userLiked ? "fill-red-500" : "group-hover:scale-110 transition-transform"} />
                  {userLiked && <motion.div initial={{ scale: 0 }} animate={{ scale: 2 }} exit={{ scale: 0 }} className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />}
                </div>
                <span className="text-xs font-mono font-medium tracking-wide uppercase">{session.likes?.length || 0} Likes</span>
              </button>

              <div className="flex flex-col items-center justify-center gap-3 p-6 border border-white/5 bg-white/[0.02]">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button 
                      key={s} 
                      onClick={() => handleRate(s)} 
                      className="hover:scale-125 transition-all duration-200"
                    >
                      <Star 
                        size={22} 
                        className={`${
                          s <= Math.round(session.rating) 
                            ? "fill-yellow-500 text-yellow-500" 
                            : "text-zinc-800 hover:text-zinc-600"
                        }`} 
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-mono font-medium tracking-wide uppercase">{session.rating?.toFixed(1) || "0.0"} Rating</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/5" />
                <h3 className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em] font-bold">Comments</h3>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <div className="space-y-8">
                {comments.map((comment: any, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    key={i} 
                    className="flex gap-5 group/comment"
                  >
                    <div className="w-10 h-10 bg-zinc-900 border border-white/10 shrink-0 flex items-center justify-center text-[11px] font-mono text-zinc-500 overflow-hidden relative">
                      {comment.userImage ? (
                        <img src={comment.userImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        comment.userName[0]
                      )}
                      <div className="absolute inset-0 border border-inset border-white/5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-xs font-bold text-white/90">{comment.userName}</span>
                        <span className="text-[10px] font-mono text-zinc-600">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-zinc-400 font-mono leading-relaxed break-words">
                        {comment.text}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {comments.length === 0 && (
                  <div className="text-center py-20 border border-dashed border-white/5 flex flex-col items-center gap-4 group hover:border-white/10 transition-colors">
                    <MessageSquare size={32} className="text-zinc-800 group-hover:text-zinc-700 transition-colors" />
                    <p className="text-[11px] font-mono text-zinc-600 tracking-widest uppercase">No discussions yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-zinc-950/80 backdrop-blur-xl">
          <div className="flex gap-3 relative">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
              placeholder="Join the discussion..."
              className="flex-1 bg-white/[0.03] border border-white/10 p-4 text-sm font-mono text-white placeholder:text-zinc-700 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
            />
            <button
              onClick={handleComment}
              disabled={isCommenting || !newComment.trim()}
              className="w-14 bg-white text-black hover:bg-zinc-200 disabled:opacity-20 transition-all flex items-center justify-center shrink-0"
            >
              {isCommenting ? <div className="w-4 h-4 border-2 border-black/20 border-t-black animate-spin rounded-full" /> : <Send size={20} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"sessions" | "community">("sessions");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [communitySort, setCommunitySort] = useState<"top" | "new">("top");

  const [selectedSocialSession, setSelectedSocialSession] = useState<any>(null);

  const { data: sessions, isLoading: sessionsLoading } = useSWR("/api/sessions", fetcher);

  const galleryUrl = debouncedQuery
    ? `/api/gallery?q=${encodeURIComponent(debouncedQuery)}`
    : `/api/gallery?sort=${communitySort}`;
  const { data: gallery, isLoading: galleryLoading, mutate: mutateGallery } = useSWR(
    activeTab === "community" ? galleryUrl : null,
    fetcher
  );

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center w-full text-foreground">
      <Navbar />

      <main className="w-full relative px-4 md:px-8 mt-4 flex-1">
        <HeroDitheringCard
          title="Your Workspace"
          titleClassName="font-comico text-4xl md:text-6xl lg:text-7xl tracking-normal text-white mb-6 md:mb-8 leading-[1.05]"
          description="Manage your sessions, build new projects, and review past executions."
          colorFront="#22D3EE"
          minHeight="min-h-[300px] md:min-h-[400px]"
          hideButton={true}
        />

        <div className="max-w-7xl mx-auto py-8 md:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab("sessions")}
                className={`text-2xl md:text-3xl font-comico font-normal transition-colors ${
                  activeTab === "sessions" ? "text-foreground" : "text-muted hover:text-foreground/70"
                }`}
              >
                Sessions
              </button>
              <button
                onClick={() => setActiveTab("community")}
                className={`text-2xl md:text-3xl font-comico font-normal transition-colors ${
                  activeTab === "community" ? "text-foreground" : "text-muted hover:text-foreground/70"
                }`}
              >
                Community
              </button>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/playground/new")}
                className="border border-border text-foreground px-6 py-3 font-mono text-sm transition-colors duration-150 ease-in-out hover:bg-foreground hover:text-background"
              >
                New Session
              </motion.button>
              <Link
                href="/compiler"
                className="border border-border text-foreground px-6 py-3 font-mono text-sm transition-colors duration-150 ease-in-out hover:bg-foreground hover:text-background"
              >
                Open Compiler →
              </Link>
            </div>
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
                    className="text-sm font-mono text-foreground hover:underline"
                  >
                    Start building →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.isArray(sessions) && sessions.map((session: any) => (
                    <SessionCard key={session.sessionId} session={session} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "community" && (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="w-full max-w-md relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search community..."
                    className="w-full bg-surface border border-border py-3 pl-4 pr-10 text-sm font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-placeholder transition-all"
                  />
                </div>
                
                <div className="flex items-center bg-zinc-900/50 p-1 border border-white/5">
                  <button
                    onClick={() => setCommunitySort("top")}
                    className={`px-6 py-2 text-[10px] font-mono transition-all ${
                      communitySort === "top" ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    TOP
                  </button>
                  <button
                    onClick={() => setCommunitySort("new")}
                    className={`px-6 py-2 text-[10px] font-mono transition-all ${
                      communitySort === "new" ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    NEW
                  </button>
                </div>
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
                  {Array.isArray(gallery) && gallery.map((session: any) => (
                    <GalleryCard key={session.shareToken} session={session} onOpenSocial={setSelectedSocialSession} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <AnimatePresence>
        {selectedSocialSession && (
          <SocialModal
            session={selectedSocialSession}
            onClose={() => setSelectedSocialSession(null)}
            onUpdate={() => mutateGallery()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
