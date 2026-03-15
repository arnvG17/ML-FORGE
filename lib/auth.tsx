"use client";

// Auth abstraction layer — only this file imports from Clerk.
// Everything else in the codebase imports from here.

import { useUser } from "@clerk/nextjs";
import { ClerkProvider } from "@clerk/nextjs";
import { SignIn, SignUp, UserButton, useClerk } from "@clerk/nextjs";
import type { ReactNode } from "react";

// ─── Client-side hook ─────────────────────────────────────────────────────
export function useCurrentUserId(): string | null {
  const { user } = useUser();
  return user?.id ?? null;
}

// ─── Shared appearance config ─────────────────────────────────────────────
export const forgeAppearance = {
  variables: {
    colorBackground: "#000000",
    colorText: "#ffffff",
    colorPrimary: "#06b6d4", // Cyan primary to match the new theme
    colorInputBackground: "rgba(255, 255, 255, 0.05)",
    colorInputText: "#ffffff",
    borderRadius: "12px", // Slightly rounded for premium feel
    fontFamily: "var(--font-inter)", // Use Inter for standard text to feel more "solid"
  },
  elements: {
    card: {
      border: "1px solid rgba(255, 255, 255, 0.12)",
      boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
      background: "#050505", // More solid background
      backdropFilter: "blur(20px)",
    },
    formButtonPrimary: {
      background: "#ffffff",
      color: "#000000",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      fontWeight: "700",
      fontSize: "12px",
      transition: "all 0.2s ease",
      "&:hover": {
        background: "#eeeeee",
        transform: "translateY(-1px)",
        boxShadow: "0 4px 12px rgba(255, 255, 255, 0.2)",
      },
    },
    socialButtonsBlockButton: {
      border: "1px solid rgba(255, 255, 255, 0.1)",
      background: "rgba(255, 255, 255, 0.03)",
      color: "#ffffff",
      transition: "all 0.2s ease",
      "&:hover": {
        background: "rgba(255, 255, 255, 0.08)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
      },
    },
    footerActionLink: { color: "#06b6d4", fontWeight: "700" },
    identityPreviewText: { color: "#cccccc" }, // Brighter for better readability
    formFieldLabel: { color: "#ffffff", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.1em" }, // Bold white for stronger feel
    formFieldInput: { border: "1px solid rgba(255, 255, 255, 0.15)", background: "rgba(255, 255, 255, 0.05)" },
    headerTitle: { fontFamily: "var(--font-inter)", fontWeight: "800", letterSpacing: "-0.02em" },
    headerSubtitle: { color: "#999999" },
    socialButtonsBlockButtonText: { fontWeight: "600" },
    // Specific hack for Clerk dev badge if it injects classes
    internal_developmentModeBadge: { display: "none !important" },
  },
};

// ─── Provider ─────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider 
      appearance={forgeAppearance}
      // @ts-ignore
      unsafe_disableDevelopmentModeWarnings={true}
    >
      {children}
    </ClerkProvider>
  );
}

// ─── Auth UI components ───────────────────────────────────────────────────
export function SignInPage() {
  return <SignIn />;
}

export function SignUpPage() {
  return <SignUp />;
}

// ─── Avatar Helper ────────────────────────────────────────────────────────
export function getForgeAvatar(seed: string) {
  // Using DiceBear Micah for a minimalistic, fun character vibe
  return `https://api.dicebear.com/7.x/micah/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

// ─── Custom UI Components ────────────────────────────────────────────────
export function ForgeUserButton() {
  const { user } = useUser();
  const seed = user?.id || "default";
  const avatarUrl = getForgeAvatar(seed);

  return (
    <UserButton
      appearance={{
        ...forgeAppearance,
        elements: {
          ...forgeAppearance.elements,
          avatarBox: {
            width: "32px",
            height: "32px",
            background: `url(${avatarUrl})`,
            backgroundSize: "cover",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "50%",
            overflow: "hidden",
            filter: "drop-shadow(0 0 8px rgba(6, 182, 212, 0.3))",
          },
          avatarImage: {
            display: "none", // Hide the default Clerk image
          },
        },
      }}
    />
  );
}

export function SignOutButton() {
  const { signOut } = useClerk();
  return (
    <button
      onClick={() => signOut()}
      className="text-[10px] font-mono font-medium text-muted hover:text-foreground transition-colors uppercase tracking-widest px-2 py-1 border border-border hover:border-primary/50 rounded bg-surface"
    >
      Log out
    </button>
  );
}

export { ForgeUserButton as UserButton };
