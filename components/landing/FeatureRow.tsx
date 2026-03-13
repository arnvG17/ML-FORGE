"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Suspense, lazy, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
);

const features = [
  {
    number: "01",
    title: "Describe",
    description:
      "Type what you want in plain English. No setup, no IDE, no blank notebook. The AI understands intent, picks the right algorithm, and starts writing immediately.",
  },
  {
    number: "02",
    title: "Watch it build",
    description:
      "The agent writes production Python live, character by character, on screen. You watch the model, the plots, and the parameters take shape in real time before anything runs.",
  },
  {
    number: "03",
    title: "Run instantly",
    description:
      "Your code executes in your browser — no server, no install, no waiting. Powered by Pyodide, sklearn runs client-side. Metrics and live plots appear the moment training finishes.",
  },
  {
    number: "04",
    title: "Interact",
    description:
      "Every parameter becomes a slider. Change tree depth, swap the criterion, toggle the decision boundary. The model retrains in under a second — data stays loaded, only training reruns.",
  },
];

const secondaryFeatures = [
  {
    number: "05",
    title: "Collaborate",
    description:
      "Share sessions with one click. Teammates can fork models, tweak parameters, and compare results in their own secure sandbox. No setup required.",
  },
  {
    number: "06",
    title: "Export",
    description:
      "One click to production. Export your final model as a trained Pickle file or a scikit-learn script ready for use in any Python environment.",
  },
  {
    number: "07",
    title: "Privacy",
    description:
      "Forge runs entirely in your browser. scikit-learn training stays local—none of your raw CSV data ever touches our servers. Your data stays yours.",
  },
  {
    number: "08",
    title: "Mastery",
    description:
      "Learn by doing. Hover over any parameter or metric to see plain-English explanations of what it is and how it affects your model's performance.",
  },
];

const differentiators = [
  {
    title: "No environment. Ever.",
    description:
      "Python runs entirely in your browser tab via WebAssembly. scikit-learn, numpy, pandas, matplotlib — all available instantly, zero install, zero config, zero cost to you.",
  },
  {
    title: "The AI designs its own UI",
    description:
      "The agent doesn't just write the model — it declares every slider, dropdown, and toggle in a schema. Your controls panel is built automatically from what the AI decided to expose.",
  },
  {
    title: "See only what matters",
    description:
      "Flask boilerplate, routing, base64 encoding — all hidden. The optional code drawer shows only the sklearn section. Beginners see results. Power users see the model logic.",
  },
  {
    title: "Pro mode for power users",
    description:
      "Toggle Pro and the code drawer opens, becomes editable. Modify the sklearn logic directly, hit re-run, and your changes deploy instantly. The full model is yours to hack.",
  },
  {
    title: "Every algorithm. One interface.",
    description:
      "Decision trees, random forests, k-means, SVMs, PCA, regression — and anything else you can describe. The agent writes fresh code for every request. No templates. No limits.",
  },
  {
    title: "Upload your own data",
    description:
      "Drop a CSV and the agent builds the entire pipeline around it — detects column types, suggests the target variable, wires up preprocessing. Your data, your model, in seconds.",
  },
];

const communityFeatures = [
  {
    tag: "fork",
    title: "Build on anyone's session",
    description:
      "Open a shared playground, change the parameters, and save it as your own starting point. Their model architecture, your experiment. No attribution lost.",
  },
  {
    tag: "rate",
    title: "Community-graded quality",
    description:
      "Rate any playground on clarity and usefulness. The highest-rated experiments surface in search and the featured gallery — no algorithmic noise, just what's actually good.",
  },
  {
    tag: "embed",
    title: "Live models in any page",
    description:
      "Every playground has an embed link. Drop it into a blog post, a course, a README. Readers interact with the live running model without leaving the page.",
  },
];

function DitheringBackground({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-35 mix-blend-screen overflow-hidden rounded-[inherit] scale-x-[1.5]">
      <Suspense fallback={null}>
        <Dithering
          colorBack="#00000000"
          colorFront={color}
          shape="warp"
          type="4x4"
          speed={0.2}
          className="size-full"
          minPixelRatio={1}
        />
      </Suspense>
    </div>
  );
}

function ScaledSection({ children, color }: { children: React.ReactNode, color: string }) {
  const containerRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.7, 1, 0.7]);
  const contentScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.42, 1, 1.42]); // 1/0.7 approx 1.42
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.6]);

  return (
    <div className="px-4 md:px-6 py-8 md:py-12 flex justify-center">
      <motion.section
        ref={containerRef}
        style={!isMobile ? { scale, opacity } : {}}
        className="w-full max-w-7xl relative overflow-hidden rounded-[24px] md:rounded-[32px] border border-border bg-surface bg-black py-16 md:py-24 px-6 md:px-12 transition-colors duration-500 shadow-sm"
      >
        <DitheringBackground color={color} />
        <motion.div style={!isMobile ? { scale: contentScale } : {}} className="relative z-10 origin-center">
          {children}
        </motion.div>
      </motion.section>
    </div>
  );
}

function FeatureGrid({ data }: { data: typeof features }) {
  return (
    <section className="px-6 py-12 md:py-24">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 relative z-10">
        {data.map((f) => (
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            key={f.number}
            className="group"
          >
            <span className="text-xs font-mono text-muted group-hover:text-white transition-colors duration-300">
              {f.number}
            </span>
            <h3 className="mt-3 text-xl font-mono font-bold group-hover:text-primary transition-colors duration-300">
              {f.title}
            </h3>
            <p className="mt-4 text-sm leading-relaxed font-mono font-light text-placeholder">
              {f.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default function FeatureRow() {
  return (
    <div className="bg-black">
      {/* ── 01–04 Columns ───────────────────────────────── */}
      <FeatureGrid data={features} />

      {/* ── Why Forge (Scaled Rounded Section) ───────────── */}
      <ScaledSection color="#8B5CF6">
        <div className="max-w-5xl mx-auto text-left">
          <div className="mb-12 md:mb-16">
            <span className="text-xs font-mono text-muted uppercase tracking-widest">
              Why Forge
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-mono font-bold">
              The gap is zero.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed font-mono font-light text-placeholder">
              Other tools give you code in a text box. You copy it, set up an
              environment, debug it, run it yourself. Forge gives you a running,
              interactive experiment. The distance between "AI wrote it" and
              "it's live" is zero.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {differentiators.map((d) => (
              <motion.div
                whileHover={{
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  y: -2,
                }}
                transition={{ duration: 0.2 }}
                key={d.title}
                className="border border-border p-6 rounded-sm bg-black/40 backdrop-blur-sm transition-all duration-300"
              >
                <h4 className="font-mono font-bold text-sm text-white/90">
                  {d.title}
                </h4>
                <p className="mt-3 text-sm leading-relaxed font-mono font-light text-placeholder">
                  {d.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </ScaledSection>

      {/* ── 05–08 Columns ───────────────────────────────── */}
      <FeatureGrid data={secondaryFeatures} />

      {/* ── Community (Scaled Rounded Section) ───────────── */}
      <ScaledSection color="#10B981">
        <div className="max-w-5xl mx-auto text-left">
          <div className="mb-12 md:mb-16">
            <span className="text-xs font-mono text-muted uppercase tracking-widest">
              Community
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-mono font-bold">
              Playgrounds worth sharing.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed font-mono font-light text-placeholder">
              Every Forge session can become a public playground. Fork, rate,
              embed. The best experiments surface to the top.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communityFeatures.map((c) => (
              <motion.div
                whileHover={{
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  y: -2,
                }}
                transition={{ duration: 0.2 }}
                key={c.title}
                className="border border-border p-6 rounded-sm bg-black/40 backdrop-blur-sm transition-all duration-300"
              >
                <span className="font-mono text-[10px] border border-border px-2 py-0.5 text-muted uppercase tracking-tight">
                  {c.tag}
                </span>
                <h4 className="mt-3 font-mono font-bold text-sm text-white/90">
                  {c.title}
                </h4>
                <p className="mt-3 text-sm leading-relaxed font-mono font-light text-placeholder">
                  {c.description}
                </p>
              </motion.div>
            ))}
          </div>
          <div className="mt-12">
            <a
              href="/playground"
              className="inline-block border border-border px-6 py-3 font-mono
                         text-sm text-muted hover:border-white hover:text-white
                         transition-colors duration-150 rounded-sm bg-black/20 backdrop-blur-sm"
            >
              Browse Playgrounds →
            </a>
          </div>
        </div>
      </ScaledSection>
    </div>
  );
}
