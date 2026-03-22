"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserButton, SignOutButton, useAuth } from "@/lib/auth";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";

export function Navbar() {
  const pathname = usePathname();
  const isSharedPage = pathname?.startsWith("/p/");
  const { walletAddress } = useAuth();
  const { isConnected } = useAccount();

  const truncatedWallet = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
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
          <div className="hidden md:flex items-center gap-6 mr-2">
            <Link href="/compiler" className="text-xs font-mono text-primary hover:text-primary/80 transition-colors uppercase tracking-widest font-bold">
              Compiler
            </Link>
            <Link href="/dashboard" className="text-xs font-mono text-muted hover:text-foreground transition-colors uppercase tracking-widest">
              Workspace
            </Link>
            <Link href="/#pricing" className="text-xs font-mono text-muted hover:text-foreground transition-colors uppercase tracking-widest">
              Pricing
            </Link>
          </div>
        )}

        {/* Wallet address badge */}
        {truncatedWallet && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-orange-400">
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
