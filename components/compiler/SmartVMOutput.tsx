"use client";

import { motion } from "framer-motion";
import { Sparkles, Table, BarChart3, Settings, AlertTriangle, CheckCircle, Code, Brain } from "lucide-react";
import PlotViewer from "@/components/playground/PlotViewer";
import { cn } from "@/lib/utils";
import type { RunResult } from "@/lib/pyodideRuntime";

interface SmartVMOutputProps {
  output: RunResult | null;
  pyodideStatus: "loading" | "ready" | "running" | "error";
  runTime: number | null;
}

export default function SmartVMOutput({ output, pyodideStatus, runTime }: SmartVMOutputProps) {
  const hasForgeResult = output?.forgeResult && typeof output.forgeResult === 'object';
  const hasMetrics = hasForgeResult && output.forgeResult.metrics && Object.keys(output.forgeResult.metrics).length > 0;
  const hasPlots = output?.plots && output.plots.length > 0;
  const hasTables = output?.tables && output.tables.length > 0;
  const hasStdout = output?.stdout && output.stdout.length > 0;
  const hasSmartOutputs = output?.smartOutputs && output.smartOutputs.length > 0;
  const hasErrors = output?.error || (hasForgeResult && output.forgeResult.errors && output.forgeResult.errors.length > 0);

  const hasAnyContent = hasMetrics || hasPlots || hasTables || hasStdout || hasSmartOutputs || hasErrors || hasForgeResult;

  const renderMetrics = () => {
    if (!hasMetrics) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="p-4 rounded-lg bg-black border border-white/10 font-mono"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-white"></div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white">METRICS</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(output.forgeResult.metrics).map(([key, value]) => (
            <div key={key} className="bg-white/5 border border-white/10 p-3 rounded-lg">
              <div className="text-[9px] text-gray-400 uppercase tracking-tighter mb-1">{key}</div>
              <div className="text-[11px] text-white font-mono font-semibold">
                {typeof value === 'number' ? value.toFixed(4) : String(value)}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderSmartOutputs = () => {
    if (!hasSmartOutputs) return null;

    const getIcon = (category: string) => {
      switch (category) {
        case 'recursion': return <Brain className="w-3 h-3" />;
        case 'recursive': return <Brain className="w-3 h-3" />;
        case 'sorting': return <BarChart3 className="w-3 h-3" />;
        case 'searching': return <Code className="w-3 h-3" />;
        case 'math': return <Sparkles className="w-3 h-3" />;
        case 'data_structures': return <Table className="w-3 h-3" />;
        default: return <Code className="w-3 h-3" />;
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="p-4 rounded-lg bg-black border border-white/10 font-mono"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-white"></div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white">SMART DETECTION</span>
        </div>
        <div className="space-y-2">
          {output.smartOutputs?.map((item: any, index: number) => (
            <motion.div
              key={`smart-output-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 text-white">
                  {getIcon(item.category)}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-white font-mono font-semibold">
                    {item.name}
                  </div>
                  <div className="text-[9px] text-gray-400 mt-1">
                    {item.description}
                  </div>
                </div>
                <div className="text-[8px] text-gray-500 uppercase tracking-tighter px-2 py-1 bg-white/5 border border-white/10 rounded">
                  {item.category}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderTables = () => {
    if (!hasTables) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="p-4 rounded-lg bg-black border border-white/10 font-mono"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-white"></div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white">DATA TABLES</span>
        </div>
        <div className="space-y-4">
          {output.tables?.map((table: any, index: number) => (
            <motion.div
              key={`table-${index}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <div className="text-[10px] text-white font-mono font-semibold">
                  {table.name || `Table ${index + 1}`}
                </div>
                {table.shape && (
                  <div className="text-[9px] text-gray-400 font-mono bg-white/5 px-2 py-1 rounded border border-white/10">
                    {table.shape[0]} × {table.shape[1]}
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-2 px-3 text-gray-500 font-semibold border-r border-white/10">
                          #
                        </th>
                        {(table.headers || table.columns || []).map((col: string, i: number) => (
                          <th key={`header-${col}-${i}`} className="text-left py-2 px-3 text-white font-semibold border-r border-white/10 last:border-r-0">
                            {col}
                            {table.dtypes?.[col] && (
                              <div className="text-[8px] text-gray-500 font-normal mt-1">
                                {table.dtypes[col]}
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(table.rows || table.data || []).map((row: any[], i: number) => (
                        <tr key={`row-${i}`} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-2 px-3 text-gray-500 font-mono border-r border-white/10">
                            {table.index ? table.index[i] : i}
                          </td>
                          {(row || []).map((cell, j) => (
                            <td key={`cell-${i}-${j}`} className="py-2 px-3 text-gray-300 font-mono border-r border-white/10 last:border-r-0">
                              {typeof cell === 'number' ? 
                                (Number.isInteger(cell) ? cell : cell.toFixed(2)) : 
                                String(cell)
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(table.data?.length > 10 || table.rows?.length > 10) && (
                    <div className="text-[9px] text-gray-500 mt-2 text-center">
                      ... and {Math.max((table.data?.length || 0), (table.rows?.length || 0)) - 10} more rows
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderPlots = () => {
    if (!hasPlots) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="p-4 rounded-lg bg-black border border-white/10 font-mono"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">PLOTS & VISUALIZATIONS</span>
          <span className="text-[8px] text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/10">
            {output.plots.length} plot{output.plots.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="space-y-4">
          {output.plots.map((b64, i) => (
            <motion.div
              key={`plot-${i}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="rounded-lg overflow-hidden bg-white border border-gray-200 shadow-lg"
            >
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <div className="text-[11px] text-gray-700 font-mono font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  Plot {i + 1}
                  <span className="text-[9px] text-gray-500 font-normal">
                    (matplotlib/seaborn)
                  </span>
                </div>
              </div>
              <div className="p-4 bg-white">
                <img
                  key={`plot-img-${i}`}
                  src={`data:image/png;base64,${b64}`}
                  alt={`Plot ${i + 1}`}
                  className="w-full h-auto rounded border border-gray-200 shadow-sm"
                  style={{ 
                    opacity: 0, 
                    transition: "opacity 500ms ease-in-out",
                    maxHeight: '500px',
                    objectFit: 'contain'
                  }}
                  onLoad={(e) => {
                    console.log(`Plot ${i + 1} loaded successfully`);
                    e.currentTarget.style.opacity = "1";
                  }}
                  onError={(e) => {
                    console.error('Failed to load plot image:', e);
                    e.currentTarget.style.display = 'none';
                    // Show error message
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'p-4 text-center text-red-500 text-xs';
                      errorDiv.textContent = `Failed to render plot ${i + 1}`;
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderStdout = () => {
    if (!hasStdout) return null;

    return (
      <div className="font-mono text-xs text-green-400 leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {output.stdout.map((line, i) => (
          <div key={i} className="before:content-['$_'] before:mr-2">
            {line}
          </div>
        ))}
      </div>
    );
  };

  const renderErrors = () => {
    const errors = [];
    if (output?.error) errors.push(output.error);
    if (hasForgeResult && output.forgeResult.errors) {
      errors.push(...output.forgeResult.errors);
    }

    if (errors.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="p-4 rounded-lg bg-black border border-red-500/20 font-mono"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">RUNTIME ERRORS</span>
        </div>
        {errors.map((error, i) => (
          <motion.div
            key={`error-${i}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            className="mb-2 last:mb-0"
          >
            <pre className="text-[11px] text-red-300 whitespace-pre-wrap font-mono leading-relaxed bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              {error}
            </pre>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const renderExplanation = () => {
    if (!hasForgeResult || !output.forgeResult.explanation) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="p-4 rounded-lg bg-black border border-white/10 font-mono"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-white"></div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white">AI EXPLANATION</span>
        </div>
        <div className="text-[11px] text-gray-300 leading-relaxed font-light">
          {output.forgeResult.explanation}
        </div>
      </motion.div>
    );
  };

  const renderControls = () => {
    if (!hasForgeResult || !output.forgeResult.controls || output.forgeResult.controls.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="p-4 rounded-lg bg-black border border-white/10 font-mono"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-white"></div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white">INTERACTIVE CONTROLS</span>
        </div>
        <div className="space-y-2">
          {output.forgeResult.controls.map((control: any, index: number) => (
            <motion.div
              key={`control-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="bg-white/5 border border-white/10 p-3 rounded-lg"
            >
              <div className="text-[9px] text-gray-400 mb-2 font-semibold">{control.label}</div>
              <div className="text-[10px] text-gray-300 font-mono">
                Type: {control.type} | Default: {control.default} | Range: [{control.min}, {control.max}]
              </div>
              <div className="text-[9px] text-white mt-1 font-mono">
                Variable: {control.targets_var}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  // Empty state
  if (!output && pyodideStatus !== "loading") {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-30 select-none pt-10">
        <div className="w-16 h-16 border-2 border-white/10 rounded-xl flex items-center justify-center bg-black">
          <div className="w-8 h-8 bg-white/10 rounded-lg"></div>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-center text-gray-500 font-mono">READY TO EXECUTE</p>
        <p className="text-[8px] text-gray-600 text-center max-w-[200px] font-mono">Run your code to see smart output detection and visualizations</p>
      </div>
    );
  }

  // Only render active sections in a logical order
  const activeSections = [];
  
  // Console output first (like in Colab)
  if (hasStdout) {
    activeSections.push(
      <motion.div
        key="console-output"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="p-4 rounded-lg bg-black border border-white/10 font-mono"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">CONSOLE OUTPUT</span>
        </div>
        <div className="font-mono text-xs text-green-400 leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {output.stdout.map((line, i) => (
            <div key={`console-line-${i}`} className="before:content-['$_'] before:mr-2">
              {line}
            </div>
          ))}
        </div>
      </motion.div>
    );
  }
  
  // Then visualizations (plots)
  if (hasPlots) activeSections.push(<div key="plots-section">{renderPlots()}</div>);
  
  // Then other content
  if (hasSmartOutputs) activeSections.push(<div key="smart-outputs-section">{renderSmartOutputs()}</div>);
  if (hasMetrics) activeSections.push(<div key="metrics-section">{renderMetrics()}</div>);
  if (hasTables) activeSections.push(<div key="tables-section">{renderTables()}</div>);
  if (hasForgeResult && output.forgeResult.explanation) activeSections.push(<div key="explanation-section">{renderExplanation()}</div>);
  if (hasForgeResult && output.forgeResult.controls) activeSections.push(<div key="controls-section">{renderControls()}</div>);
  if (hasErrors) activeSections.push(<div key="errors-section">{renderErrors()}</div>);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {activeSections.length > 0 ? activeSections : (
        <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-30 select-none">
          <div className="w-16 h-16 border-2 border-white/10 rounded-xl flex items-center justify-center bg-black">
            <div className="w-8 h-8 bg-white/10 rounded-lg"></div>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-center text-gray-500 font-mono">NO OUTPUT DETECTED</p>
          <p className="text-[8px] text-gray-600 text-center max-w-[200px] font-mono">Run your code to generate output</p>
        </div>
      )}
    </div>
  );
}
