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
  forgeResult?: any;
  tables?: any[];
  smartOutputs?: any[];
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

# Try to import seaborn and set it to use matplotlib backend
try:
    import seaborn as sns
    sns.set_style("whitegrid")
    print("Seaborn imported successfully")
except ImportError:
    print("Seaborn not available, using matplotlib only")

# Capture stdout
_forge_stdout = io.StringIO()
sys.stdout = _forge_stdout

# Snapshot existing figures BEFORE user code runs
_forge_figs_before = set(plt.get_fignums())
print(f"Figures before execution: {len(_forge_figs_before)}")
`;

  // The postamble runs AFTER the user's code
  // It captures any new figures as base64 PNG strings
  const postamble = `
# Restore stdout
sys.stdout = sys.__stdout__

# SMART EXECUTION - Simple direct approach
if 'forge_result' in globals():
    forge_result = globals()['forge_result']
    if isinstance(forge_result, dict) and 'plots' in forge_result:
        plots_dict = forge_result['plots']
        if isinstance(plots_dict, dict) and len(plots_dict) == 0:
            print("[SMART RUNTIME] Empty plots dict - attempting direct fix")
            
            # Simple approach: execute make_plot directly in the current context
            try:
                # Try to execute make_plot if it exists anywhere
                exec_result = None
                if 'make_plot' in globals():
                    exec_result = globals()['make_plot']()
                    print("[SMART RUNTIME] Called make_plot from globals")
                else:
                    # Try to find and execute make_plot from the current execution context
                    try:
                        exec_result = eval('make_plot()', globals())
                        print("[SMART RUNTIME] Called make_plot via eval")
                    except:
                        print("[SMART RUNTIME] make_plot not found via eval")
                
                if exec_result and isinstance(exec_result, str) and len(exec_result) > 50:
                    plots_dict['direct_plot'] = exec_result
                    print("[SMART RUNTIME] Successfully added direct plot")
                else:
                    print("[SMART RUNTIME] Direct plot generation failed")
                    
            except Exception as e:
                print(f"[SMART RUNTIME] Direct fix failed: {e}")

# Find figures created by user's code
_forge_figs_after = set(plt.get_fignums())
_forge_new_figs = _forge_figs_after - _forge_figs_before
print(f"Figures after execution: {len(_forge_figs_after)}")
print(f"New figures created: {len(_forge_new_figs)}")

# Encode each new figure as base64 PNG
_forge_plots = []
_forge_tables = []
for _forge_fig_num in sorted(_forge_new_figs):
    try:
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
        plot_b64 = base64.b64encode(_forge_buf.read()).decode('utf-8')
        _forge_plots.append(plot_b64)
        print(f"Successfully captured figure {_forge_fig_num} as base64 ({len(plot_b64)} chars)")
        plt.close(_forge_fig)
    except Exception as e:
        print(f"Error capturing figure {_forge_fig_num}: {e}")
        # Try to close the figure anyway to avoid conflicts
        try:
            plt.close(_forge_fig_num)
        except:
            pass

# Capture forge_result if it exists
_forge_result = None
print(f"Checking globals for forge_result...")
print(f"Globals keys: {[k for k in globals().keys() if not k.startswith('_forge_') and not k.startswith('__')]}")

if 'forge_result' in globals():
    _forge_result = globals()['forge_result']
    print(f"Found forge_result: {type(_forge_result)}")
    print(f"forge_result keys: {list(_forge_result.keys()) if isinstance(_forge_result, dict) else 'not a dict'}")
    
    # Extract plots from forge_result if they exist
    if isinstance(_forge_result, dict) and 'plots' in _forge_result:
        plots_dict = _forge_result['plots']
        print(f"[SMART RUNTIME] Found plots in forge_result: {type(plots_dict)}")
        print(f"[SMART RUNTIME] Plots dict keys: {list(plots_dict.keys()) if isinstance(plots_dict, dict) else 'not a dict'}")
        
        # Debug: Check if plots_dict is empty
        if isinstance(plots_dict, dict) and len(plots_dict) == 0:
            print("[SMART RUNTIME] plots_dict is empty - checking if make_plot() was called")
            # Check if there's a make_plot function in globals
            if 'make_plot' in globals():
                print("[SMART RUNTIME] make_plot function found in globals but plots dict is empty - function may not have been called")
                # Try to call it automatically
                try:
                    make_plot_result = globals()['make_plot']()
                    print(f"[SMART RUNTIME] Auto-called make_plot(): {type(make_plot_result)}")
                    if isinstance(make_plot_result, str) and len(make_plot_result) > 50:
                        plots_dict['auto_generated_plot'] = make_plot_result
                        print("[SMART RUNTIME] Added auto-generated plot to forge_result")
                        # Update the actual forge_result
                        if isinstance(_forge_result, dict):
                            _forge_result['plots'] = plots_dict
                except Exception as e:
                    print(f"[SMART RUNTIME] Failed to auto-call make_plot(): {e}")
            else:
                print("[SMART RUNTIME] make_plot function not found in globals")
                # Check if there's a make_plot in locals (might be defined in try block)
                try:
                    # Try to access the last executed frame's locals
                    import sys
                    frame = sys._getframe()
                    if 'make_plot' in frame.f_locals:
                        print("[SMART RUNTIME] Found make_plot in locals, trying to call it")
                        make_plot_result = frame.f_locals['make_plot']()
                        if isinstance(make_plot_result, str) and len(make_plot_result) > 50:
                            plots_dict['auto_generated_plot'] = make_plot_result
                            if isinstance(_forge_result, dict):
                                _forge_result['plots'] = plots_dict
                            print("[SMART RUNTIME] Successfully called make_plot from locals")
                except Exception as e:
                    print(f"[SMART RUNTIME] Failed to access make_plot from locals: {e}")
        
        if isinstance(plots_dict, dict):
            for plot_name, plot_b64 in plots_dict.items():
                print(f"[SMART RUNTIME] Plot {plot_name}: type={type(plot_b64)}, length={len(plot_b64) if plot_b64 else 0}")
                # More flexible validation - accept any string with reasonable length
                if isinstance(plot_b64, str) and len(plot_b64) > 50:  # Reduced threshold for validation
                    _forge_plots.append(plot_b64)
                    print(f"[SMART RUNTIME] Added plot {plot_name} to _forge_plots")
                else:
                    print(f"[SMART RUNTIME] Plot {plot_name} failed validation: type={type(plot_b64)}, len={len(plot_b64) if plot_b64 else 0}")
                    # Still try to add it if it's a string, just in case
                    if isinstance(plot_b64, str):
                        _forge_plots.append(plot_b64)
                        print(f"[SMART RUNTIME] Force-added plot {plot_name} despite short length")
        else:
            print(f"[SMART RUNTIME] plots is not a dict: {plots_dict}")
            # If plots_dict is not a dict but exists, try to handle it
            if plots_dict is not None:
                print(f"[SMART RUNTIME] Attempting to handle non-dict plots: {type(plots_dict)}")
                try:
                    # Try to convert to dict if it's a Pyodide proxy
                    converted = plots_dict.toJs() if hasattr(plots_dict, 'toJs') else plots_dict
                    if isinstance(converted, dict):
                        for plot_name, plot_b64 in converted.items():
                            if isinstance(plot_b64, str) and len(plot_b64) > 50:
                                _forge_plots.append(plot_b64)
                                print(f"[SMART RUNTIME] Added converted plot {plot_name}")
                except Exception as e:
                    print(f"[SMART RUNTIME] Failed to convert plots: {e}")
    else:
        print(f"[SMART RUNTIME] No plots found in forge_result. Available keys: {list(_forge_result.keys()) if isinstance(_forge_result, dict) else 'not a dict'}")
        # Debug: Check if forge_result has any plot-related keys
        if isinstance(_forge_result, dict):
            plot_related_keys = [k for k in _forge_result.keys() if 'plot' in k.lower()]
            if plot_related_keys:
                print(f"[SMART RUNTIME] Found plot-related keys: {plot_related_keys}")
            else:
                print("[SMART RUNTIME] No plot-related keys found in forge_result")
    
    # Extract tables from forge_result if they exist
    if isinstance(_forge_result, dict) and 'tables' in _forge_result:
        _forge_tables = _forge_result['tables']
else:
    print("forge_result not found in globals")

# Auto-capture pandas DataFrames as tables
import pandas as pd
def _forge_capture_dataframe(df, name):
    if isinstance(df, pd.DataFrame):
        # Convert DataFrame to a more table-friendly format
        table_data = {
            'name': name,
            'headers': list(df.columns),
            'rows': df.head(20).values.tolist(),
            'shape': df.shape,
            'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
            'index': df.index.tolist()[:20]  # Include index for better display
        }
        return table_data
    return None

# Scan globals for DataFrames
_forge_auto_tables = []
try:
    globals_list = list(globals().items())  # Convert to list to avoid dictionary changed size during iteration
    for name, obj in globals_list:
        if not name.startswith('_forge_') and name not in ['In', 'Out', 'get_ipython', 'exit', 'quit']:
            table_info = _forge_capture_dataframe(obj, name)
            if table_info:
                _forge_auto_tables.append(table_info)
except Exception as e:
    # If table capture fails, continue without it
    pass

# Smart output detection and formatting
def _forge_format_output():
    """Smart detection and formatting of different output types"""
    formatted_outputs = []
    
    try:
        # Check for factorial/recursion patterns
        globals_list = list(globals().items())  # Convert to list to avoid dictionary changed size during iteration
        for name, obj in globals_list:
            if not name.startswith('_forge_') and name not in ['In', 'Out', 'get_ipython', 'exit', 'quit']:
                # Detect factorial functions
                if hasattr(obj, '__call__') and 'factorial' in name.lower():
                    formatted_outputs.append({
                        'type': 'function',
                        'name': name,
                        'category': 'recursion',
                        'description': f'Factorial function detected: {name}'
                    })
                
                # Detect recursive functions
                if hasattr(obj, '__call__') and hasattr(obj, '__code__'):
                    try:
                        import inspect
                        source = inspect.getsource(obj)
                        if 'return' in source and name.lower() in source:
                            formatted_outputs.append({
                                'type': 'function',
                                'name': name,
                                'category': 'recursive',
                                'description': f'Recursive function detected: {name}'
                            })
                    except:
                        pass
        
        # Check for common algorithm patterns
        algorithm_patterns = {
            'sorting': ['sort', 'bubble', 'quick', 'merge', 'selection', 'insertion'],
            'searching': ['search', 'binary', 'linear'],
            'math': ['fibonacci', 'prime', 'gcd', 'lcm'],
            'data_structures': ['stack', 'queue', 'tree', 'graph', 'linked']
        }
        
        for category, patterns in algorithm_patterns.items():
            for pattern in patterns:
                globals_list = list(globals().items())  # Convert to list to avoid dictionary changed size during iteration
                for name, obj in globals_list:
                    if not name.startswith('_forge_') and pattern in name.lower():
                        formatted_outputs.append({
                            'type': 'algorithm',
                            'name': name,
                            'category': category,
                            'description': f'{category.title()} algorithm detected: {name}'
                        })
    except Exception as e:
        # If smart detection fails, continue without it
        pass
    
    return formatted_outputs

_forge_smart_outputs = _forge_format_output()

# Combine manual and auto-captured tables
_forge_all_tables = list(_forge_tables) if _forge_tables else []
_forge_all_tables.extend(_forge_auto_tables)
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

    // Pull forge_result back to JavaScript
    const forgeResultPy = pyodide.globals.get('_forge_result');
    const forgeResult = forgeResultPy?.toJs?.() || forgeResultPy;

    // Pull tables back to JavaScript
    const tablesPy = pyodide.globals.get('_forge_all_tables');
    const tables = tablesPy?.toJs?.() || [];

    // Pull smart outputs back to JavaScript
    const smartOutputsPy = pyodide.globals.get('_forge_smart_outputs');
    const smartOutputs = smartOutputsPy?.toJs?.() || [];

    return { stdout, plots, error: null, forgeResult, tables, smartOutputs };

  } catch (err: any) {
    // Make sure stdout is always restored even on error
    try { 
      const py = await getPyodide();
      py.runPython('import sys; sys.stdout = sys.__stdout__'); 
    } catch {}

    return {
      stdout: [],
      plots:  [],
      error:  err?.message ?? String(err),
      forgeResult: null,
      tables: [],
      smartOutputs: []
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
