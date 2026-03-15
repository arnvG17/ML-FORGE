"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserButton, SignOutButton } from "@/lib/auth";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const isSharedPage = pathname?.startsWith("/p/");

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
            <Link href="/dashboard" className="text-xs font-mono text-muted hover:text-foreground transition-colors uppercase tracking-widest">
              Workspace
            </Link>
          </div>
        )}
        <ThemeToggle />
        <SignOutButton />
        <UserButton />
      </div>
    </nav>
  );
}
