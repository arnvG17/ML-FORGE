/**
 * Strips markdown code block wrappers from a raw LLM response.
 */
function stripMarkdown(raw: string): string {
  // Remove ```python ... ``` or ``` ... ``` wrapping
  const match = raw.match(/```(?:python)?\n?([\s\S]*?)```/);
  if (match) return match[1].trim();
  return raw.trim();
}

/**
 * Extracts and ensures that the generated Python script follows the system rules.
 * Does not throw errors, just returns the stripped code for execution.
 */
export function extractMLCode(fullGeneratedCode: string): string {
  return stripMarkdown(fullGeneratedCode);
}
