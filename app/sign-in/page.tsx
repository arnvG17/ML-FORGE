"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithGoogle, useAuth } from "@/lib/auth";
import { HeroDitheringCard } from "@/components/ui/hero-dithering-card";
import { motion } from "framer-motion";
import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirect = searchParams.get("redirect") || "/compiler";

  // If already signed in, redirect
  if (!loading && user) {
    router.replace(redirect);
    return null;
  }

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
      router.replace(redirect);
    } catch (err: any) {
      console.error("Sign-in error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError(null); // User just closed the popup, not a real error
      } else {
        setError(err.message || "Sign-in failed. Please try again.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex bg-black">
      {/* Left Area - Branding / Visual */}
      <div className="hidden lg:flex flex-1 relative bg-black items-center justify-center p-4 py-6 border-r border-white/5 z-10">
        <HeroDitheringCard
          title="WELCOME"
          description="Sign in to your workbench and continue building."
          colorFront="#06b6d4"
          minHeight="h-[96vh]"
          hideButton={true}
          className="w-full h-full max-w-none shadow-2xl"
          titleClassName="font-comico text-7xl xl:text-8xl tracking-tight text-white mb-6 leading-[1.1]"
        />
      </div>

      {/* Right Area - Sign In */}
      <div className="flex-1 flex flex-col items-center justify-center bg-black p-8 relative z-0">
        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="font-comico text-5xl tracking-tight text-white">
              FORGE
            </h1>
            <p className="text-sm font-mono text-zinc-500">
              AI-powered code generation & execution
            </p>
          </div>

          {/* Sign In Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={isSigningIn || loading}
            className="w-full flex items-center justify-center gap-3 h-14 rounded-xl bg-white text-black font-mono font-semibold text-sm tracking-wide transition-all duration-200 hover:bg-zinc-100 hover:shadow-lg hover:shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black animate-spin rounded-full" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </motion.button>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3"
            >
              {error}
            </motion.div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              Secure Auth
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] font-mono text-zinc-700 leading-relaxed">
            By signing in, you agree to use FORGE responsibly.
            <br />
            Powered by Firebase Authentication.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-zinc-600 font-mono text-xs">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
