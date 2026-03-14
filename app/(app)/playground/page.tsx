"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NewPlaygroundPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /playground/new which PlaygroundLayout handles as a fresh session
    router.replace("/playground/new");
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <span className="text-sm font-mono text-muted">
        Creating session...
      </span>
    </div>
  );
}
