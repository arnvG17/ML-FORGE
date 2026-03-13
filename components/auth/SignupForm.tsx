"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    // Client-side auth — store user info locally
    localStorage.setItem("forge_token", "local-dev-token");
    localStorage.setItem("forge_user_email", email);
    localStorage.setItem("forge_user_name", name);
    router.push("/dashboard");
  };

  return (
    <div className="w-full max-w-[340px] flex flex-col pt-12 pb-8">
      <h1 className="text-5xl font-comico tracking-normal mb-12 text-black text-center">FORGE</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-[13px] font-mono font-medium text-zinc-600">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="w-full bg-[#EBF0FA]/50 text-black border-none rounded-xl px-4 py-4 text-sm font-semibold placeholder:font-normal placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all duration-200"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-[13px] font-mono font-medium text-zinc-600">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full bg-[#EBF0FA]/50 text-black border-none rounded-xl px-4 py-4 text-sm font-semibold placeholder:font-normal placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all duration-200"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-[13px] font-mono font-medium text-zinc-600">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full bg-[#EBF0FA]/50 text-black border-none rounded-xl px-4 py-4 text-sm font-semibold placeholder:font-normal placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all duration-200"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirmPassword" className="text-[13px] font-mono font-medium text-zinc-600">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full bg-[#EBF0FA]/50 text-black border-none rounded-xl px-4 py-4 text-sm font-semibold placeholder:font-normal placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all duration-200"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 font-mono">
            {error}
          </p>
        )}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-black text-white px-6 py-4 mt-6 font-sans font-semibold text-[15px] transition-all duration-200 hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgb(0,0,0,0.1)]"
        >
          {loading ? "Creating account..." : "Create Account"}
        </motion.button>
      </form>

      <div className="mt-8 flex items-center justify-center gap-2">
        <p className="text-sm text-zinc-500 font-mono font-medium">Already have an account?</p>
        <Link
          href="/login"
          className="text-sm text-black font-bold hover:underline"
        >
          Sign in
        </Link>
      </div>

      <div className="mt-auto pt-24 pb-4">
        <p className="text-[11px] text-zinc-400 font-medium tracking-wide text-center">
          <b className="font-comico text-zinc-500 mr-1">FORGE</b> Crafted with Code. For Builders.
        </p>
      </div>
    </div>
  );
}
