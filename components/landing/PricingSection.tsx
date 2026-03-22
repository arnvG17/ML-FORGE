"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Suspense, lazy } from "react";

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
);

const plans = [
  {
    name: "Free",
    price: "0",
    currency: "ETH",
    period: "",
    description: "Get started with basic features",
    features: [
      "Browser-based Python execution",
      "Basic ML model generation",
      "Community playgrounds access",
      "CSV upload & preprocessing",
      "3 AI generations per day",
    ],
    notIncluded: [
      "Unlimited AI generations",
      "Advanced model architectures",
      "Priority execution queue",
      "Export to production",
    ],
    cta: "Get Started Free",
    highlighted: false,
    color: "#6366F1",
  },
  {
    name: "Pro",
    price: "0.001",
    currency: "ETH",
    period: "/month",
    description: "Full power. No limits.",
    features: [
      "Everything in Free",
      "Unlimited AI generations",
      "Advanced model architectures",
      "Priority execution queue",
      "Export to production",
      "AI-powered code chat",
      "Custom dataset training",
      "Session history & restore",
    ],
    notIncluded: [],
    cta: "Upgrade to Pro",
    highlighted: true,
    color: "#06B6D4",
  },
];

export default function PricingSection() {
  const router = useRouter();
  const { user } = useAuth();

  const handleCtaClick = (plan: typeof plans[0]) => {
    if (plan.name === "Free") {
      router.push(user ? "/playground" : "/sign-in?redirect=/playground");
    } else {
      router.push(user ? "/dashboard?upgrade=true" : "/sign-in?redirect=/dashboard?upgrade=true");
    }
  };

  return (
    <section className="relative py-24 px-6 overflow-hidden" id="pricing">
      {/* Background shader */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-15 overflow-hidden">
        <Suspense fallback={null}>
          <Dithering
            colorBack="#00000000"
            colorFront="#8B5CF6"
            shape="warp"
            type="4x4"
            speed={0.15}
            className="size-full"
            minPixelRatio={1}
          />
        </Suspense>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-mono text-primary/60 uppercase tracking-widest">
            Pricing
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-comico tracking-tight text-foreground">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-sm font-mono text-muted max-w-lg mx-auto">
            Start free. Upgrade when you need unlimited AI power.
            <br />
            <span className="text-primary/50">Powered by Ethereum • Sepolia Testnet</span>
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className={`relative rounded-2xl border p-8 flex flex-col backdrop-blur-sm transition-all duration-300 ${
                plan.highlighted
                  ? "border-primary/40 bg-primary/5 shadow-xl shadow-primary/10"
                  : "border-border bg-surface/50"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 text-[10px] font-mono font-bold uppercase tracking-widest bg-primary text-white rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-mono font-bold text-foreground">
                  {plan.name}
                </h3>
                <p className="mt-1 text-xs font-mono text-muted">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-mono font-bold text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm font-mono text-muted">
                  {plan.currency}
                  {plan.period}
                </span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs font-mono text-foreground/70">{feature}</span>
                  </li>
                ))}
                {plan.notIncluded.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 opacity-40">
                    <svg className="w-4 h-4 mt-0.5 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-xs font-mono text-muted line-through">{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleCtaClick(plan)}
                className={`w-full py-3.5 rounded-xl font-mono font-semibold text-sm tracking-wide transition-all duration-200 ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/20"
                    : "bg-white/5 border border-border text-foreground hover:bg-white/10 hover:border-primary/30"
                }`}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center mt-8 text-[10px] font-mono text-zinc-600">
          🔒 Payments are secured via Ethereum blockchain • Cancel anytime
        </p>
      </div>
    </section>
  );
}
