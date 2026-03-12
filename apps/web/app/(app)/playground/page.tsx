"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createLocalSession } from "@/components/dashboard/SessionList";

export default function NewPlaygroundPage() {
  const router = useRouter();

  useEffect(() => {
    const session = createLocalSession();
    router.replace(`/playground/${session.id}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <span className="text-sm font-mono text-muted">
        Creating session...
      </span>
    </div>
  );
}
