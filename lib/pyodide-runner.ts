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

    console.log("[Pyodide] Running Python script...");
    await pyodide.runPythonAsync(code);

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
      metrics: {},
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
