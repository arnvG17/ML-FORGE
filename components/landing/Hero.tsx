"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HeroDitheringCard } from "@/components/ui/hero-dithering-card";

export default function Hero() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
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
          buttonText="Start Building →"
          colorFront="#EC4E02"
          onClick={() => router.push("/login")}
          className="pt-20 pb-12"
          titleClassName="font-comico text-5xl md:text-8xl lg:text-[120px] tracking-tighter text-white mb-6 md:mb-8 leading-none"
          minHeight="min-h-[60vh] md:min-h-[70vh]"
          contentScale={!isMobile ? contentScale : 1}
        />
      </motion.div>
    </div>
  );
}
