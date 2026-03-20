"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";

export function AuthToast() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only show if not loading, not logged in, and not dismissed
    // Also don't show on the login page itself to avoid redundancy
    if (!loading && !user && !isDismissed && pathname !== "/sign-in") {
      // Small delay so it pops in after initial page load smoothly
      const timer = setTimeout(() => setIsVisible(true), 2500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [user, loading, isDismissed, pathname]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-20 right-4 z-50 w-80 bg-surface/95 backdrop-blur-xl border border-border shadow-2xl shadow-black/50 rounded-2xl p-4 flex flex-col gap-3"
        >
          <button 
            onClick={() => setIsDismissed(true)}
            className="absolute top-3 right-3 text-muted hover:text-foreground p-1 transition-colors bg-black/20 hover:bg-black/40 rounded-full"
            aria-label="Dismiss sign in prompt"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div className="pr-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
              <span className="font-comico text-lg text-primary tracking-tighter mt-1">F</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground font-mono">Welcome to FORGE</h3>
              <p className="text-[11px] text-muted mt-0.5 leading-tight">Fastest way to start coding.</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsVisible(false);
              router.push("/sign-in");
            }}
            className="mt-2 w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-white text-black font-mono font-bold text-xs tracking-wide transition-all duration-200 hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] shadow-md border border-white/20 hover:shadow-white/10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            Sign In
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
