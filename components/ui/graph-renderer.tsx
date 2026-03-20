"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Surface,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { detectForgeGraphTag } from "@/lib/graph-utils";
import { cn } from "@/lib/utils";

interface GraphRendererProps {
  content: string;
  className?: string;
}

interface ControlState {
  [key: string]: number;
}

interface ForgeGraphData {
  equation: string;
  explanation: string;
  mode: "2d" | "3d";
  data: any[];
  config: {
    xKey: string;
    yKey: string;
    zKey?: string;
    chartType: 'line' | 'scatter' | 'surface';
    color?: string;
    title?: string;
  };
  controls: Array<{
    id: string;
    label: string;
    min: number;
    max: number;
    step: number;
    default: number;
  }>;
}

export default function GraphRenderer({ content, className }: GraphRendererProps) {
  const [graphData, setGraphData] = useState<ForgeGraphData | null>(null);
  const [controlValues, setControlValues] = useState<ControlState>({});
  const [processedData, setProcessedData] = useState<any[]>([]);

  useEffect(() => {
    const data = detectForgeGraphTag(content);
    if (data) {
      setGraphData(data);
      // Initialize control values with defaults
      const defaults: ControlState = {};
      data.controls.forEach(control => {
        defaults[control.id] = control.default;
      });
      setControlValues(defaults);
    } else {
      setGraphData(null);
    }
  }, [content]);

  useEffect(() => {
    if (graphData && Object.keys(controlValues).length > 0) {
      generateData();
    }
  }, [graphData, controlValues]);

  const generateData = () => {
    if (!graphData) return;

    // Generate data based on control values
    const newData = graphData.data.map((point: any) => {
      const newPoint = { ...point };
      
      // Apply control transformations
      Object.entries(controlValues).forEach(([key, value]) => {
        if (key === 'M') {
          // Amplitude multiplier
          if (newPoint.y !== undefined) newPoint.y *= value;
          if (newPoint.z !== undefined) newPoint.z *= value;
        } else if (key === 'NOISE') {
          // Add noise
          if (newPoint.y !== undefined) newPoint.y += (Math.random() - 0.5) * value;
          if (newPoint.z !== undefined) newPoint.z += (Math.random() - 0.5) * value;
        }
      });
      
      return newPoint;
    });
    
    setProcessedData(newData);
  };

  const handleControlChange = (controlId: string, value: number) => {
    setControlValues(prev => ({
      ...prev,
      [controlId]: value
    }));
  };

  if (!graphData) {
    return null;
  }

  const renderChart = () => {
    const { config } = graphData;
    const chartColor = config.color || "#00C896";

    if (graphData.mode === "2d") {
      if (config.chartType === 'scatter') {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
              <XAxis 
                dataKey={config.xKey} 
                stroke="white" 
                tick={{ fill: 'white', fontSize: 10 }}
              />
              <YAxis 
                stroke="white" 
                tick={{ fill: 'white', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0A0A0A', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white'
                }}
              />
              <Scatter 
                dataKey={config.yKey} 
                fill={chartColor}
              />
            </ScatterChart>
          </ResponsiveContainer>
        );
      } else {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
              <XAxis 
                dataKey={config.xKey} 
                stroke="white" 
                tick={{ fill: 'white', fontSize: 10 }}
              />
              <YAxis 
                stroke="white" 
                tick={{ fill: 'white', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0A0A0A', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white'
                }}
              />
              <Line 
                type="monotone" 
                dataKey={config.yKey} 
                stroke={chartColor}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      }
    } else {
      // 3D visualization using scatter plot with z-axis
      return (
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
            <XAxis 
              dataKey={config.xKey} 
              stroke="white" 
              tick={{ fill: 'white', fontSize: 10 }}
            />
            <YAxis 
              dataKey={config.yKey} 
              stroke="white" 
              tick={{ fill: 'white', fontSize: 10 }}
            />
            <ZAxis 
              dataKey={config.zKey} 
              stroke="white" 
              tick={{ fill: 'white', fontSize: 10 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0A0A0A', 
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white'
              }}
            />
            <Scatter 
              dataKey={config.zKey} 
              fill={chartColor}
            />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div className={cn("bg-black border border-white/20 rounded-2xl p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-mono text-sm font-semibold">Scientific Graph</h3>
          <p className="text-white/60 text-xs font-mono mt-1">{graphData.explanation}</p>
        </div>
        <div className="text-white/40 text-xs font-mono bg-white/10 px-2 py-1 rounded">
          {graphData.mode.toUpperCase()}
        </div>
      </div>

      {/* Equation Display */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
        <code className="text-white/90 text-xs font-mono">{graphData.equation}</code>
      </div>

      {/* Chart Display */}
      <div className="relative bg-black/50 border border-white/10 rounded-lg overflow-hidden p-4">
        {renderChart()}
      </div>

      {/* Controls */}
      {graphData.controls.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white/80 text-xs font-mono font-semibold">Controls</h4>
          <div className="grid grid-cols-1 gap-3">
            {graphData.controls.map((control) => (
              <div key={control.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-white/70 text-xs font-mono">{control.label}</label>
                  <span className="text-white/50 text-xs font-mono bg-white/10 px-2 py-0.5 rounded">
                    {controlValues[control.id]?.toFixed(2) || control.default.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={controlValues[control.id] || control.default}
                  onChange={(e) => handleControlChange(control.id, parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #00C896;
          border-radius: 50%;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #00C896;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
