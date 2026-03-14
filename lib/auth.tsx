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
    colorPrimary: "#8B5CF6", // Purple primary to match Forge
    colorInputBackground: "rgba(255, 255, 255, 0.03)",
    colorInputText: "#ffffff",
    borderRadius: "12px", // Slightly rounded for premium feel
    fontFamily: "var(--font-mono)",
  },
  elements: {
    card: {
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
      background: "rgba(0, 0, 0, 0.8)",
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
    footerActionLink: { color: "#8B5CF6", fontWeight: "600" },
    identityPreviewText: { color: "#888888" },
    formFieldLabel: { color: "rgba(255, 255, 255, 0.6)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em" },
    formFieldInput: { border: "1px solid rgba(255, 255, 255, 0.1)", background: "rgba(255, 255, 255, 0.03)" },
  },
};

// ─── Provider ─────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider appearance={forgeAppearance}>{children}</ClerkProvider>
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
            filter: "drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))",
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
      className="text-[10px] font-mono font-medium text-zinc-500 hover:text-white transition-colors uppercase tracking-widest px-2 py-1 border border-white/5 hover:border-white/20 rounded"
    >
      Log out
    </button>
  );
}

export { ForgeUserButton as UserButton };
