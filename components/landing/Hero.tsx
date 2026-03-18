"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HeroDitheringCard } from "@/components/ui/hero-dithering-card";

const HERO_COLORS = ["#10B981", "#EAB308", "#3B82F6", "#EF4444", "#8B5CF6", "#F97316", "#06B6D4", "#6366F1", "#EC4E02"];

export default function Hero() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [heroColor, setHeroColor] = useState("#EC4E02");

  useEffect(() => {
    setHeroColor(HERO_COLORS[Math.floor(Math.random() * HERO_COLORS.length)]);
    const checkMobile = () => setIsMobile(window.innerWidth < 1100); // Higher threshold for large Hero card
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.7]);
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 1.42]); // Inverse of 0.7 is approx 1.42
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.6]);

  return (
    <div ref={containerRef} className="relative w-full overflow-visible">
      <motion.div style={!isMobile ? { scale, opacity } : {}} className="w-full origin-center">
        <HeroDitheringCard
          title="FORGE"
          description="AI-driven scikit-learn playground. Describe your model, stream the code, interact with results instantly. No local environment required."
          colorFront={heroColor}
          hideButton={true}
          className="pt-12 pb-12"
          titleClassName="font-comico text-5xl md:text-8xl lg:text-[120px] tracking-tighter text-white mb-6 md:mb-8 leading-none"
          minHeight="min-h-[60vh] md:min-h-[70vh]"
          contentScale={!isMobile ? contentScale : 1}
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/sign-in")}
              className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-white px-10 text-base font-mono font-medium text-black transition-all duration-300 hover:bg-white/90 hover:ring-4 hover:ring-white/20 w-full md:w-auto"
            >
              <span className="relative z-10">Start Building →</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/compiler")}
              className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-10 text-base font-mono font-medium text-white transition-all duration-300 hover:bg-white/10 hover:border-white/40 w-full md:w-auto"
            >
              <span className="relative z-10">Try the Compiler →</span>
            </motion.button>
          </div>
        </HeroDitheringCard>
      </motion.div>
    </div>
  );
}
