"use client";

import { useState, Suspense, lazy } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
)

export interface HeroDitheringCardProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  buttonText?: string;
  colorFront?: string;
  onClick?: () => void;
  className?: string;
  titleClassName?: string;
  minHeight?: string;
  hideButton?: boolean;
  children?: React.ReactNode;
  contentScale?: any;
}

export function HeroDitheringCard({
  title,
  description,
  buttonText = "Start Typing",
  colorFront = "#EC4E02",
  onClick,
  className,
  titleClassName = "font-comico text-5xl md:text-6xl lg:text-8xl tracking-tight text-white mb-8 leading-[1.05]",
  minHeight = "min-h-[600px]",
  hideButton = false,
  children,
  contentScale
}: HeroDitheringCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className={cn("w-full flex justify-center items-center", className)}>
      <div
        className="w-full max-w-7xl relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={cn("relative overflow-hidden rounded-[24px] border border-white/5 bg-black w-full flex flex-col items-center justify-center duration-500", minHeight)}>
          <Suspense fallback={<div className="absolute inset-0 bg-white/5" />}>
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40 scale-x-[1.5] mix-blend-screen">
              <Dithering
                colorBack="#00000000"
                colorFront={colorFront}
                shape="warp"
                type="4x4"
                speed={isHovered ? 0.6 : 0.2}
                className="size-full"
                minPixelRatio={1}
              />
            </div>
          </Suspense>

          <motion.div 
            style={{ scale: contentScale }}
            className="relative z-10 px-6 max-w-4xl mx-auto text-center flex flex-col items-center py-16 origin-center"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={titleClassName}>
              {title}
            </motion.h2>

            {description && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-white/60 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed font-mono font-light">
                {description}
              </motion.p>
            )}

            {children && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-full mt-4 flex flex-col items-center">
                {children}
              </motion.div>
            )}

            {!hideButton && !children && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                onClick={onClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-white px-12 text-base font-mono font-medium text-black transition-colors duration-300 hover:bg-white/90 hover:ring-4 hover:ring-white/20">
                <span className="relative z-10">{buttonText}</span>
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
