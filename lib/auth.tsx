"use client";

// Auth abstraction layer — only this file imports from Firebase.
// Everything else in the codebase imports from here.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithCustomToken,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";

// ─── Auth Context ──────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  walletAddress: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  walletAddress: null,
});

// ─── Session Cookie Helpers ────────────────────────────────────────────────
async function syncSessionCookie(user: User | null) {
  if (user) {
    const token = await user.getIdToken();
    document.cookie = `__session=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  } else {
    document.cookie = "__session=; path=/; max-age=0";
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────
export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const firebaseAuth = getFirebaseAuth();
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      await syncSessionCookie(firebaseUser);
      // Extract wallet address from UID if it's a wallet user
      if (firebaseUser?.uid?.startsWith("wallet_")) {
        setWalletAddress(firebaseUser.uid.replace("wallet_", ""));
      } else {
        setWalletAddress(null);
      }
    });
    return () => unsub();
  }, []);

  // Refresh the token cookie periodically (every 10 minutes)
  useEffect(() => {
    const interval = setInterval(async () => {
      const firebaseAuth = getFirebaseAuth();
      const currentUser = firebaseAuth?.currentUser;
      if (currentUser) {
        await syncSessionCookie(currentUser);
      }
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, walletAddress }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hooks ─────────────────────────────────────────────────────────────────
export function useAuth() {
  return useContext(AuthContext);
}

export function useCurrentUserId(): string | null {
  const { user } = useAuth();
  return user?.uid ?? null;
}

// ─── Sign In / Sign Out Actions ────────────────────────────────────────────
export async function signInWithGoogle() {
  const firebaseAuth = getFirebaseAuth();
  const provider = getGoogleProvider();
  const result = await signInWithPopup(firebaseAuth, provider);
  const token = await result.user.getIdToken();
  document.cookie = `__session=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  return result.user;
}

export async function signInWithWallet(customToken: string) {
  const firebaseAuth = getFirebaseAuth();
  const result = await signInWithCustomToken(firebaseAuth, customToken);
  const token = await result.user.getIdToken();
  document.cookie = `__session=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  return result.user;
}

export async function signOutUser() {
  document.cookie = "__session=; path=/; max-age=0";
  const firebaseAuth = getFirebaseAuth();
  await firebaseSignOut(firebaseAuth);
}

// ─── Avatar Helper ─────────────────────────────────────────────────────────
export function getForgeAvatar(seed: string) {
  return `https://api.dicebear.com/7.x/micah/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

// ─── UI Components ─────────────────────────────────────────────────────────
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ForgeUserButton() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { data: sub } = useSWR(user ? "/api/subscription" : null, fetcher);

  if (!user) return null;

  const displayName = user.displayName || "User";
  const email = user.email || "No email";
  const seed = email || user.uid;
  const isPro = sub?.active === true;
  
  const avatarUrl = getForgeAvatar(seed);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-8 h-8 rounded-full overflow-hidden border-2 flex items-center justify-center bg-surface transition-all duration-200 shadow-sm ${
          isPro 
            ? "border-emerald-500 ring-2 ring-emerald-500/20 hover:ring-emerald-500/40" 
            : "border-white/10 hover:border-primary/50 hover:ring-2 hover:ring-primary/20"
        }`}
      >
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 py-2 bg-surface/95 backdrop-blur-sm border border-border rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className={`px-4 py-3 flex flex-col gap-1 ${isPro ? "border-b border-border" : ""}`}>
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted truncate">{email}</p>
            </div>
            {isPro && (
              <div className="px-4 py-3 flex flex-col gap-2 bg-emerald-500/5">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">Pro mode activated</span>
                </div>
                {sub.txHash && (
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${sub.txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono text-zinc-500 hover:text-white transition-colors flex items-center gap-1 mt-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Receipt
                  </a>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function SignOutButton() {
  const { user } = useAuth();
  const router = useRouter();

  if (user) {
    return (
      <button
        onClick={() => signOutUser()}
        className="text-[10px] font-mono font-medium text-muted hover:text-foreground transition-colors uppercase tracking-widest px-2 py-1 border border-border hover:border-primary/50 rounded bg-surface"
      >
        Log out
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push("/sign-in")}
      className="text-[10px] font-mono font-medium text-muted hover:text-foreground transition-colors uppercase tracking-widest px-2 py-1 border border-border hover:border-primary/50 rounded bg-surface"
    >
      Log in
    </button>
  );
}

export { ForgeUserButton as UserButton };
