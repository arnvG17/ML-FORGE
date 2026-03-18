export function detectVisualOutput(code: string): boolean {
  if (!code) return false;

  const patterns = [
    "plt.",
    "plt.show",
    "plt.savefig",
    "sns.",
    "plotly",
    ".plot(",
    "fig, ax",
    "Figure(",
  ];

  return patterns.some((pattern) => code.includes(pattern));
}
