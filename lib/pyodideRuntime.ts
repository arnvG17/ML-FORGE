/**
 * Compiler-mode Pyodide runtime.
 * Reuses the singleton Pyodide instance from pyodide-runner.ts.
 * All runs share pyodide.globals — AI code can read user's variables.
 */

import { getPyodide } from "./pyodide-runner";

// ── Types ───────────────────────────────────────────────────────────
export interface RunResult {
  stdout: string[];
  plots: string[];
  error: string | null;
}

export interface VariableInfo {
  name: string;
  typeName: string;
  shape: string;
}

// ── PUBLIC API ──────────────────────────────────────────────────────

/**
 * Runs user code in the shared Pyodide namespace.
 * Captures stdout and any new matplotlib plots.
 */
async function executeAndCapture(code: string): Promise<RunResult> {
  const pyodide = await getPyodide();

  // The preamble runs BEFORE the user's code
  // It snapshots which figures already exist so we can
  // detect NEW figures created by the user's code
  const preamble = `
import sys, io, base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Capture stdout
_forge_stdout = io.StringIO()
sys.stdout = _forge_stdout

# Snapshot existing figures BEFORE user code runs
_forge_figs_before = set(plt.get_fignums())
`;

  // The postamble runs AFTER the user's code
  // It captures any new figures as base64 PNG strings
  const postamble = `
# Restore stdout
sys.stdout = sys.__stdout__

# Find figures created by user's code
_forge_figs_after = set(plt.get_fignums())
_forge_new_figs = _forge_figs_after - _forge_figs_before

# Encode each new figure as base64 PNG
_forge_plots = []
for _forge_fig_num in sorted(_forge_new_figs):
    _forge_fig = plt.figure(_forge_fig_num)
    _forge_buf = io.BytesIO()
    _forge_fig.savefig(
        _forge_buf,
        format='png',
        bbox_inches='tight',
        dpi=150,
        facecolor=_forge_fig.get_facecolor()
    )
    _forge_buf.seek(0)
    _forge_plots.append(
        base64.b64encode(_forge_buf.read()).decode('utf-8')
    )
    plt.close(_forge_fig)
`;

  try {
    // Run preamble + user code + postamble in one call
    await pyodide.runPythonAsync(preamble + '\n' + code + '\n' + postamble);

    // Pull stdout back to JavaScript
    const stdoutRaw: string = pyodide.globals.get('_forge_stdout').getvalue();
    const stdout = stdoutRaw.split('\n').filter((l: string) => l.trim() !== '');

    // Pull plots back to JavaScript
    const plotsPy = pyodide.globals.get('_forge_plots');
    const plots: string[] = plotsPy.toJs();   // JS array of base64 strings

    return { stdout, plots, error: null };

  } catch (err: any) {
    // Make sure stdout is always restored even on error
    try { 
      const py = await getPyodide();
      py.runPython('import sys; sys.stdout = sys.__stdout__'); 
    } catch {}

    return {
      stdout: [],
      plots:  [],
      error:  err?.message ?? String(err)
    };
  }
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Runs user code in the shared Pyodide namespace.
 * Captures stdout and any new matplotlib plots.
 */
export async function runUserCode(code: string): Promise<RunResult> {
  console.log("[CompilerRuntime] Running user code...");
  const result = await executeAndCapture(code);
  if (result.error) {
    console.log("[CompilerRuntime] User code error:", result.error);
  } else {
    console.log(
      `[CompilerRuntime] User code OK. stdout: ${result.stdout.length} lines, plots: ${result.plots.length}`
    );
  }
  return result;
}

/**
 * Runs AI-generated code in the SAME namespace as the user's code.
 * Errors are returned silently — never crash the runtime.
 */
export async function runAICode(code: string): Promise<RunResult> {
  console.log("[CompilerRuntime] Running AI code...");
  const result = await executeAndCapture(code);
  if (result.error) {
    console.log("[CompilerRuntime] AI code error (silent):", result.error);
  } else {
    console.log(
      `[CompilerRuntime] AI code OK. stdout: ${result.stdout.length} lines, plots: ${result.plots.length}`
    );
  }
  return result;
}

/**
 * Inspects the shared namespace and returns user-defined variables.
 * Filters out modules, dunders, _forge_ internals, and pyodide builtins.
 */
export async function inspectNamespace(): Promise<VariableInfo[]> {
  const pyodide = await getPyodide();

  try {
    await pyodide.runPythonAsync(`
import json as _forge_json

def _forge_inspect():
    import types
    skip_prefixes = ('_forge_', '_pyodide', '__')
    skip_names = {'In', 'Out', 'get_ipython', 'exit', 'quit', 'open',
                  'display', 'print', 'input', 'help', 'copyright',
                  'credits', 'license', 'plt', 'matplotlib', 'sys',
                  'io', 'base64', 'json', '_forge_json', 'types',
                  'micropip', 'pyodide', 'pyodide_http', 'js'}
    results = []
    g = globals()
    for name in sorted(g.keys()):
        if any(name.startswith(p) for p in skip_prefixes):
            continue
        if name in skip_names:
            continue
        val = g[name]
        if isinstance(val, (types.ModuleType, types.FunctionType,
                            types.BuiltinFunctionType, type)):
            # Include user-defined functions but skip modules and types
            if isinstance(val, types.FunctionType):
                results.append({
                    "name": name,
                    "typeName": "function",
                    "shape": ""
                })
            continue
        type_name = type(val).__name__
        shape = ""
        if hasattr(val, 'shape'):
            shape = str(val.shape)
        elif isinstance(val, (list, tuple, set, frozenset)):
            shape = f"len {len(val)}"
        elif isinstance(val, dict):
            shape = f"len {len(val)}"
        elif isinstance(val, str):
            shape = f"len {len(val)}"
        results.append({
            "name": name,
            "typeName": type_name,
            "shape": shape
        })
    return _forge_json.dumps(results)

_forge_inspect_result = _forge_inspect()
`);

    const rawJson = pyodide.globals.get("_forge_inspect_result");
    if (!rawJson) return [];
    return JSON.parse(rawJson) as VariableInfo[];
  } catch (e: any) {
    console.error("[CompilerRuntime] inspectNamespace error:", e.message);
    return [];
  }
}
