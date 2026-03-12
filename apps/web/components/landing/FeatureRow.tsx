const features = [
  {
    number: "01",
    title: "Write",
    description:
      "Describe what you want in plain English. The AI agent writes production-ready Python code, complete with tunable parameters and structured output.",
  },
  {
    number: "02",
    title: "Execute",
    description:
      "Your code runs instantly in a secure sandbox. Watch results stream in real-time — metrics, plots, and interactive controls appear as the script finishes.",
  },
  {
    number: "03",
    title: "Interact",
    description:
      "Adjust sliders and dropdowns to re-run with different parameters. Only the changed layers re-execute, so feedback is nearly instant.",
  },
];

export default function FeatureRow() {
  return (
    <section className="border-t border-border px-6 py-24">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
        {features.map((feature) => (
          <div key={feature.number}>
            <span className="text-sm font-mono font-light text-muted">
              {feature.number}
            </span>
            <h3 className="mt-3 text-2xl font-mono font-bold">
              {feature.title}
            </h3>
            <p className="mt-4 text-sm leading-relaxed font-light text-placeholder">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
