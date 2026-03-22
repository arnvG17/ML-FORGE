"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserButton, SignOutButton, useAuth } from "@/lib/auth";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";

export function Navbar() {
  const pathname = usePathname();
  const isSharedPage = pathname?.startsWith("/p/");
  const { walletAddress } = useAuth();
  const { isConnected } = useAccount();

  const truncatedWallet = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  const tabs = [
    { 
      id: "compiler", 
      label: "Compiler", 
      href: "/compiler",
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M4 17h16" />
        </svg>
      )
    },
    { 
      id: "dashboard", 
      label: "Dashboard", 
      href: "/dashboard",
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    { 
      id: "pricing", 
      label: "Pricing", 
      href: "/#pricing",
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  ];

  const activeTab = pathname?.startsWith("/compiler")
    ? "compiler"
    : pathname?.startsWith("/dashboard")
      ? "dashboard"
      : pathname?.startsWith("/pricing")
        ? "pricing"
        : null;

  return (
    <nav className="w-full flex items-center justify-between px-4 md:px-8 py-4 md:py-5 border-b border-border z-30 bg-surface/80 backdrop-blur-md sticky top-0">
      <Link href="/" className="flex items-center gap-2 group">
        <span className="text-2xl md:text-3xl font-comico tracking-tight text-foreground mt-1 group-hover:text-primary transition-colors">
          FORGE
        </span>
      </Link>
      
      <div className="flex items-center gap-4 md:gap-6">
        {!isSharedPage && (
          <div className="hidden md:flex items-center bg-zinc-100 dark:bg-zinc-900/60 rounded-full p-1 border border-zinc-200 dark:border-white/5 mr-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`relative px-4 py-1.5 min-w-[90px] text-center text-[11px] font-mono font-bold tracking-widest uppercase transition-colors rounded-full ${
                    isActive
                      ? "text-zinc-900 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-tab"
                      className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-full shadow-sm border border-zinc-200/50 dark:border-white/5"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    {tab.icon}
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Wallet address badge */}
        {truncatedWallet && (
          <div className="hidden md:flex items-center gap-2 px-2 py-1">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span className="text-xs font-mono text-muted-foreground/80 hover:text-foreground transition-colors cursor-default">
              {truncatedWallet}
            </span>
          </div>
        )}

        <ThemeToggle />
        <SignOutButton />
        <UserButton />
      </div>
    </nav>
  );
}
