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

// ── Stdout / Plot capture preamble ──────────────────────────────────
const CAPTURE_PREAMBLE = `
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import sys, io, base64

_forge_stdout = io.StringIO()
sys.stdout = _forge_stdout
_forge_figs_before = set(plt.get_fignums())
`;

const CAPTURE_EPILOGUE = `
import json as _forge_json

# Collect stdout
sys.stdout = sys.__stdout__
_forge_captured_stdout = _forge_stdout.getvalue().split('\\n')

# Collect new plots as base64 from matplotlib
_forge_new_figs = set(plt.get_fignums()) - _forge_figs_before
_forge_plots = []
for _forge_fn in sorted(_forge_new_figs):
    _forge_fig = plt.figure(_forge_fn)
    _forge_buf = io.BytesIO()
    _forge_fig.savefig(_forge_buf, format='png', bbox_inches='tight', facecolor=_forge_fig.get_facecolor())
    _forge_buf.seek(0)
    _forge_plots.append(base64.b64encode(_forge_buf.read()).decode('utf-8'))
    _forge_buf.close()
    plt.close(_forge_fig)

# Check for forge_result
_forge_extra_stdout = []
if 'forge_result' in globals():
    _fr = globals()['forge_result']
    if isinstance(_fr, dict):
        # Add plots if any
        if 'plots' in _fr and isinstance(_fr['plots'], dict):
            for _pname, _pdata in _fr['plots'].items():
                if _pdata not in _forge_plots:
                    _forge_plots.append(_pdata)
        
        # Add metrics as stdout lines
        if 'metrics' in _fr and isinstance(_fr['metrics'], dict):
            _forge_extra_stdout.append("METRICS:")
            for _mname, _mval in _fr['metrics'].items():
                _forge_extra_stdout.append(f"  {_mname}: {_mval}")
        
        # Add explanation
        if 'explanation' in _fr and _fr['explanation']:
            _forge_extra_stdout.append("")
            _forge_extra_stdout.append("EXPLANATION:")
            _forge_extra_stdout.append(str(_fr['explanation']))

_forge_run_result = _forge_json.dumps({
    "stdout": _forge_captured_stdout + _forge_extra_stdout,
    "plots": _forge_plots
})
`;

// ── Helper: run code and extract RunResult ──────────────────────────
async function executeAndCapture(code: string): Promise<RunResult> {
  const pyodide = await getPyodide();

  const fullCode = CAPTURE_PREAMBLE + "\n" + code + "\n" + CAPTURE_EPILOGUE;

  try {
    await pyodide.runPythonAsync(fullCode);

    const rawJson = pyodide.globals.get("_forge_run_result");
    if (!rawJson) {
      return { stdout: [], plots: [], error: null };
    }

    const parsed = JSON.parse(rawJson);
    // Filter empty trailing lines from stdout
    const stdout = (parsed.stdout as string[]).filter(
      (line: string, i: number, arr: string[]) =>
        i < arr.length - 1 || line.trim() !== ""
    );

    return {
      stdout,
      plots: parsed.plots || [],
      error: null,
    };
  } catch (e: any) {
    // Restore stdout in case the error happened mid-execution
    try {
      await pyodide.runPythonAsync("import sys; sys.stdout = sys.__stdout__");
    } catch {
      // ignore
    }
    return {
      stdout: [],
      plots: [],
      error: e.message || String(e),
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
