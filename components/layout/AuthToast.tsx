"use client";

import { useState, useEffect } from "react";
import { useAuth, signInWithGoogle } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function AuthToast() {
  const { user, loading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only show if not loading, not logged in, and not dismissed
    // Also don't show on the login page itself to avoid redundancy
    if (!loading && !user && !isDismissed && pathname !== "/login") {
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
            onClick={async () => {
              setIsVisible(false);
              try {
                await signInWithGoogle();
              } catch (e) {
                console.error("AuthToast sign in failed", e);
                // Re-show on failure if needed, or rely on other flows
              }
            }}
            className="mt-2 w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-white text-black font-mono font-bold text-xs tracking-wide transition-all duration-200 hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] shadow-md border border-white/20 hover:shadow-white/10"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            One-Tap Google Sign In
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
