declare global {
  interface Window {
    loadPyodide: any;
  }
}

let pyodideInstance: any = null;
let isLoading = false;

/**
 * Ensures a single instance of Pyodide is loaded globally.
 */
export async function getPyodide() {
  if (typeof window === "undefined") {
    throw new Error("Pyodide can only run in the browser.");
  }

  if (pyodideInstance) {
    console.log("[Pyodide] Using cached instance.");
    return pyodideInstance;
  }

  if (!window.loadPyodide) {
    console.error("[Pyodide] window.loadPyodide missing. Is the CDN script in layout.tsx?");
    throw new Error("Pyodide script not loaded. Check layout.tsx.");
  }

  if (isLoading) {
    console.log("[Pyodide] Already loading, waiting...");
    // Wait for the instance to be available if another call initiated the load
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (pyodideInstance) {
          clearInterval(interval);
          resolve(pyodideInstance);
        }
      }, 100);
    });
  }

  isLoading = true;
  const start = Date.now();
  console.log("[Pyodide] Initializing core...");
  
  try {
    const pyodide = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
    });

    console.log("[Pyodide] Core loaded. Installing packages: scikit-learn, matplotlib, numpy, pandas, scipy, micropip...");
    await pyodide.loadPackage([
      "micropip",
      "scikit-learn",
      "matplotlib",
      "numpy",
      "pandas",
      "scipy",
    ]);

    console.log("[Pyodide] Packages installed. Applying network patch and installing extra libs (seaborn, statsmodels)...");
    // Apply network patch to support HTTPS via browser fetch
    await pyodide.runPythonAsync(`
import micropip
await micropip.install(['pyodide-http', 'seaborn', 'statsmodels'])
import pyodide_http
pyodide_http.patch_all()
    `);

    // Load smart plot detector system
    console.log("[Pyodide] Loading smart plot detection system...");
    try {
      // The smart detector will be loaded from the file system when needed
      console.log("[Pyodide] Smart detector ready for import");
    } catch (error) {
      console.warn("[Pyodide] Smart detector not available:", error);
    }

    console.log(`[Pyodide] Fully initialized in ${Date.now() - start}ms.`);
    pyodideInstance = pyodide;
    return pyodideInstance;
  } catch (err: any) {
    console.error("[Pyodide] Load failed:", err.message);
    throw err;
  } finally {
    isLoading = false;
  }
}

/**
 * Returns whether the Pyodide instance has been successfully loaded.
 */
export function isLoaded(): boolean {
  return pyodideInstance !== null;
}

/**
 * Preloads Pyodide. Call this on mount in the playground.
 */
export function preload() {
  console.log("[Pyodide] Manual preload triggered.");
  getPyodide().catch((err) => console.error("[Pyodide] Preload failed:", err));
}

export type PyodideResult = {
  metrics: Record<string, number | string>;
  plots: Record<string, string>;
  controls: any[];
  explanation?: string;
  errors: string[];
};

/**
 * Runs a Python code string and extracts the "forge_result" variable.
 */
export async function runInBrowser(code: string): Promise<PyodideResult> {
  console.log("[Pyodide] Starting code execution...");
  const start = Date.now();
  
  const defaultResult: PyodideResult = {
    metrics: {},
    plots: {},
    controls: [],
    explanation: "",
    errors: [],
  };

  try {
    const pyodide = await getPyodide();
    const globals = pyodide.globals;

    console.log("[Pyodide] Running Python script with smart plot detection...");
    
    // Load smart plot detector if not already loaded
    await pyodide.runPythonAsync(`
# Load smart plot detector system
import sys
import io
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from io import BytesIO

# Define smart detector inline if not available
class SmartPlotDetector:
    def __init__(self):
        self.detected_patterns = []
        
    def analyze_code(self, code):
        """Analyze code to detect plotting patterns - more comprehensive detection"""
        if 'forge_result' in code and 'plots' in code:
            self.detected_patterns.append('manual_forge_result')
        if 'def make_plot(' in code:
            self.detected_patterns.append('make_plot_function')
        if any(call in code for call in ['plt.figure(', 'plt.plot(', 'plt.scatter(', 'plt.hist(', 'plt.subplot(', 'plt.subplots(']):
            self.detected_patterns.append('direct_matplotlib')
        if 'sns.' in code or 'seaborn' in code.lower():
            self.detected_patterns.append('seaborn_usage')
        if 'plt.show()' in code:
            self.detected_patterns.append('explicit_show')
        # More aggressive detection - any matplotlib usage
        if 'plt.' in code and 'import matplotlib' in code:
            self.detected_patterns.append('matplotlib_usage')
        return self.detected_patterns

def find_and_call_make_plot(global_vars):
    """Find make_plot function and call it"""
    if 'make_plot' in global_vars and callable(global_vars['make_plot']):
        try:
            result = global_vars['make_plot']()
            print(f"[SMART DETECTOR] Successfully called make_plot: {type(result)}")
            return result
        except Exception as e:
            print(f"[SMART DETECTOR] Failed to call make_plot: {e}")
    return None

def smart_execute_with_params(code, global_vars):
    """Execute code with smart plot detection - ALWAYS ensure dynamic plots"""
    detector = SmartPlotDetector()
    patterns = detector.analyze_code(code)
    print(f"[SMART DETECTOR] Found patterns: {patterns}")
    
    # Execute the code
    exec(code, global_vars)
    print("[SMART EXECUTOR] Code executed successfully")
    
    # ALWAYS try to call make_plot if it exists - this ensures dynamic plots
    plot_result = find_and_call_make_plot(global_vars)
    if plot_result:
        print("[SMART EXECUTOR] Successfully called make_plot for dynamic plot")
        
        # If forge_result exists, update it; if not, create it
        if 'forge_result' in global_vars:
            forge_result = global_vars['forge_result']
            if isinstance(forge_result, dict):
                if 'plots' not in forge_result:
                    forge_result['plots'] = {}
                forge_result['plots']['dynamic_plot'] = plot_result
                print("[SMART EXECUTOR] Updated existing forge_result with dynamic plot")
            else:
                # Replace non-dict forge_result
                global_vars['forge_result'] = {
                    'plots': {'dynamic_plot': plot_result},
                    'metrics': {},
                    'controls': [],
                    'explanation': 'Dynamic plot automatically generated',
                    'errors': []
                }
        else:
            # Create new forge_result with the dynamic plot
            global_vars['forge_result'] = {
                'plots': {'dynamic_plot': plot_result},
                'metrics': {},
                'controls': [],
                'explanation': 'Dynamic plot automatically generated',
                'errors': []
            }
            print("[SMART EXECUTOR] Created new forge_result with dynamic plot")
    else:
        print("[SMART EXECUTOR] No make_plot function found or failed to call")
        
        # Fallback: try to capture matplotlib figures directly
        if 'forge_result' in global_vars:
            forge_result = global_vars['forge_result']
            if isinstance(forge_result, dict) and 'plots' in forge_result:
                plots_dict = forge_result['plots']
                if isinstance(plots_dict, dict) and len(plots_dict) == 0:
                    print("[SMART EXECUTOR] Empty plots dict - attempting matplotlib capture")
                    try:
                        # Get all current figures
                        figures = [plt.figure(i) for i in plt.get_fignums()]
                        if figures:
                            plots = {}
                            for i, fig in enumerate(figures):
                                buf = BytesIO()
                                fig.savefig(buf, format='png', bbox_inches='tight', dpi=150)
                                buf.seek(0)
                                plot_b64 = base64.b64encode(buf.read()).decode('utf-8')
                                plots[f'auto_capture_{i+1}'] = plot_b64
                                plt.close(fig)
                                print(f"[SMART EXECUTOR] Auto-captured figure {i+1}")
                            
                            forge_result['plots'] = plots
                            print(f"[SMART EXECUTOR] Added {len(plots)} auto-captured plots")
                        else:
                            print("[SMART EXECUTOR] No matplotlib figures found to capture")
                    except Exception as e:
                        print(f"[SMART EXECUTOR] Auto-capture failed: {e}")
        
        # If still no forge_result, create one with any available plots
        elif 'direct_matplotlib' in patterns:
            print("[SMART EXECUTOR] Creating forge_result from matplotlib patterns")
            try:
                figures = [plt.figure(i) for i in plt.get_fignums()]
                if figures:
                    plots = {}
                    for i, fig in enumerate(figures):
                        buf = BytesIO()
                        fig.savefig(buf, format='png', bbox_inches='tight', dpi=150)
                        buf.seek(0)
                        plot_b64 = base64.b64encode(buf.read()).decode('utf-8')
                        plots[f'matplotlib_plot_{i+1}'] = plot_b64
                        plt.close(fig)
                    
                    global_vars['forge_result'] = {
                        'plots': plots,
                        'metrics': {},
                        'controls': [],
                        'explanation': 'Auto-captured matplotlib plots',
                        'errors': []
                    }
                    print(f"[SMART EXECUTOR] Created forge_result with {len(plots)} matplotlib plots")
            except Exception as e:
                print(f"[SMART EXECUTOR] Matplotlib capture failed: {e}")

print("[Pyodide] Smart plot detection system loaded")
`);

    // Execute the user's code with smart detection
    await pyodide.runPythonAsync(`
# Capture stdout
import sys
import io
_forge_stdout = io.StringIO()
sys.stdout = _forge_stdout

# Execute with smart detection
smart_execute_with_params('''${code.replace(/'''/g, "\\'\\'\\'")}''', globals())

# Restore stdout
sys.stdout = sys.__stdout__
`);

    console.log("[Pyodide] Execution finished. Extracting forge_result...");
    const rawResult = globals.get("forge_result");

    if (!rawResult) {
      console.warn("[Pyodide] forge_result not found in globals.");
      return {
        ...defaultResult,
        errors: ["forge_result variable was not set by the Python script."],
      };
    }

    const dictConverter = (obj: any) => Object.fromEntries(obj);

    // Convert proxy object to JS Map/Record
    const resultObj = typeof rawResult.toJs === "function" 
      ? rawResult.toJs({ dict_converter: dictConverter })
      : rawResult;

    const formattedResult: PyodideResult = {
      metrics: resultObj.metrics || {},
      plots: resultObj.plots || {},
      controls: resultObj.controls || [],
      explanation: resultObj.explanation || "",
      errors: resultObj.errors || [],
    };

    // Coerce numeric types specifically due to numpy.float64 serialization constraints
    if (resultObj.metrics) {
      for (const [key, value] of Object.entries(resultObj.metrics)) {
        if (typeof value === "number") {
          formattedResult.metrics[key] = Number(value);
        } else if (typeof value === "string") {
          formattedResult.metrics[key] = value;
        } else {
           formattedResult.metrics[key] = Number(value); 
        }
      }
    }

    // Get stdout from captured output
    const stdoutRaw: string = globals.get('_forge_stdout').getvalue();
    const stdoutLines = stdoutRaw.split('\n').filter((l: string) => l.trim() !== '');
    console.log("[Pyodide] Smart detection output:", stdoutLines);

    console.log(`[Pyodide] Success! Extracted ${Object.keys(formattedResult.metrics).length} metrics and ${Object.keys(formattedResult.plots).length} plots in ${Date.now() - start}ms.`);
    return formattedResult;
  } catch (error: any) {
    console.error("[Pyodide] Runtime Error:", error.message);
    return {
      ...defaultResult,
      errors: [error.message || String(error)],
    };
  }
}
