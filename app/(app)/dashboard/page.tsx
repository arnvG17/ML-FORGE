"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SessionList from "@/components/dashboard/SessionList";
import NewSessionButton from "@/components/dashboard/NewSessionButton";
import { HeroDitheringCard } from "@/components/ui/hero-dithering-card";

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("forge_user_email") || "";
    setUserEmail(email);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("forge_token");
    localStorage.removeItem("forge_user_email");
    localStorage.removeItem("forge_user_name");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center w-full">
      <nav className="w-full flex items-center justify-between px-4 md:px-8 py-4 md:py-5 border-b border-border z-20 bg-surface">
        <span className="text-2xl md:text-3xl font-comico tracking-tight text-white mt-1">FORGE</span>
        <div className="flex items-center gap-4 md:gap-6">
          <span className="hidden sm:inline text-xs md:text-sm font-light text-muted font-mono">{userEmail}</span>
          <button
            onClick={handleSignOut}
            className="text-xs md:text-sm font-light text-placeholder hover:text-white font-mono transition-colors duration-150"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="w-full relative px-4 md:px-8 mt-4 flex-1">
        <HeroDitheringCard
          title="Your Workspace"
          titleClassName="font-comico text-4xl md:text-6xl lg:text-7xl tracking-normal text-white mb-6 md:mb-8 leading-[1.05]"
          description="Manage your sessions, build new projects, and review past executions."
          colorFront="#8B5CF6"
          minHeight="min-h-[300px] md:min-h-[400px]"
          hideButton={true}
        />

        <div className="max-w-7xl mx-auto py-8 md:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
            <h1 className="text-3xl md:text-4xl font-comico font-normal text-white">Sessions</h1>
            <NewSessionButton />
          </div>
          <SessionList />
        </div>
      </main>
    </div>
  );
}
