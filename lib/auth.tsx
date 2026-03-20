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
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";

// ─── Auth Context ──────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
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
    <AuthContext.Provider value={{ user, loading }}>
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
export function ForgeUserButton() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const displayName = user.displayName || "User";
  const email = user.email || "No email";
  const seed = email || user.uid;
  
  const avatarUrl = getForgeAvatar(seed);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-surface hover:border-primary/50 transition-all duration-200 shadow-sm hover:ring-2 hover:ring-primary/20"
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
          <div className="absolute right-0 mt-2 w-48 py-2 bg-surface/95 backdrop-blur-sm border border-border rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-2 flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted truncate">{email}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function SignOutButton() {
  const { user } = useAuth();

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
      onClick={() => signInWithGoogle()}
      className="text-[10px] font-mono font-medium text-muted hover:text-foreground transition-colors uppercase tracking-widest px-2 py-1 border border-border hover:border-primary/50 rounded bg-surface"
    >
      Log in
    </button>
  );
}

export { ForgeUserButton as UserButton };
