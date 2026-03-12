"use client";

import { HeroDitheringCard } from "@/components/ui/hero-dithering-card";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  return (
    <HeroDitheringCard
      title="FORGE"
      description="Describe it. Watch it build. See it run."
      buttonText="Start Building →"
      pillText="AI-Powered Context"
      colorFront="#EC4E02"
      onClick={() => router.push("/login")}
      className="pt-20 pb-12"
      titleClassName="font-bebas text-7xl md:text-8xl lg:text-[120px] tracking-tighter text-white mb-8 leading-none"
      minHeight="min-h-[80vh]"
    />
  );
}
