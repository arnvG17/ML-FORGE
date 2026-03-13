"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    // Client-side auth — store user info locally
    localStorage.setItem("forge_token", "local-dev-token");
    localStorage.setItem("forge_user_email", email);
    localStorage.setItem("forge_user_name", email.split("@")[0]);
    router.push("/dashboard");
  };

  return (
    <div className="w-full max-w-[340px] flex flex-col">
      <form onSubmit={handleSubmit} className="w-full flex flex-col">
        <h2 className="text-4xl text-white font-mono font-bold tracking-tight mb-6 text-center">Sign in</h2>

        <button type="button" className="w-full bg-white/[0.03] hover:bg-white/10 transition-colors flex items-center justify-center h-10 rounded-full border border-white/5">
          <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleLogo.svg" alt="googleLogo" className="w-4 h-4 opacity-70" />
        </button>

        <div className="flex items-center w-full my-6">
          <div className="w-full h-px bg-white/5"></div>
        </div>

        <div className="flex items-center w-full bg-transparent border border-white/20 focus-within:border-white/40 transition-colors h-10 rounded-full overflow-hidden pl-4 gap-2 mb-4">
          <svg width="14" height="10" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-zinc-500 min-w-[14px]">
            <path fillRule="evenodd" clipRule="evenodd" d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z" fill="currentColor" />
          </svg>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email id"
            className="bg-transparent text-white placeholder-zinc-500 outline-none text-sm w-full h-full font-mono"
            required
          />
        </div>

        <div className="flex items-center w-full bg-transparent border border-white/20 focus-within:border-white/40 transition-colors h-10 rounded-full overflow-hidden pl-4 gap-2">
          <svg width="11" height="15" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-zinc-500 min-w-[11px]">
            <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625-1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="currentColor" />
          </svg>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="bg-transparent text-white placeholder-zinc-500 outline-none text-sm w-full h-full font-mono"
            required
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-2 font-mono mt-4">
            {error}
          </p>
        )}

        <div className="w-full flex items-center justify-between mt-6 text-zinc-400">
          <div className="flex items-center gap-2">
            <input className="h-3 w-3 bg-transparent border-white/20 rounded accent-indigo-500" type="checkbox" id="checkbox" />
            <label className="text-xs font-mono cursor-pointer select-none" htmlFor="checkbox">Remember me</label>
          </div>
          <a className="text-xs font-mono hover:text-white transition-colors" href="#">Forgot password?</a>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={loading}
          className="mt-6 w-full h-10 rounded-full text-white bg-indigo-500 hover:bg-indigo-600 transition-colors font-mono font-bold text-sm disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Login"}
        </motion.button>

        <p className="text-zinc-500 text-xs font-mono mt-6 text-center">
          Don't have an account?{" "}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign up
          </Link>
        </p>

        <div className="mt-8 pt-8 border-t border-white/5">
          <p className="text-[11px] text-zinc-500 font-mono font-medium tracking-wide text-center flex items-center justify-center gap-1.5">
            <span className="font-comico text-sm text-zinc-400 tracking-wider">FORGE</span> Crafted with Code. For Builders.
          </p>
        </div>
      </form>
    </div>
  );
}
