export interface ForgeGraphData {
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

export function detectForgeGraphTag(content: string): ForgeGraphData | null {
  // Check if content contains forge_graph tag
  const forgeGraphMatch = content.match(/<forge_graph>([\s\S]*?)<\/forge_graph>/);
  
  if (!forgeGraphMatch) {
    return null;
  }

  try {
    // Parse the JSON content inside the tag
    const graphData = JSON.parse(forgeGraphMatch[1]);
    
    // Validate required fields
    if (!graphData.equation || !graphData.data || !graphData.mode || !graphData.config) {
      console.warn('Invalid forge_graph data: missing required fields');
      return null;
    }

    // Ensure data is an array
    if (!Array.isArray(graphData.data)) {
      console.warn('Invalid forge_graph data: data must be an array');
      return null;
    }

    return graphData as ForgeGraphData;
  } catch (error) {
    console.error('Error parsing forge_graph JSON:', error);
    return null;
  }
}

// Helper function to generate sample data for testing
export function generateSampleData(type: 'line' | 'scatter' | 'surface', mode: '2d' | '3d') {
  const points = 100;
  const data = [];
  
  if (mode === '2d') {
    for (let i = 0; i < points; i++) {
      const x = (i / points) * 10 - 5;
      const y = Math.sin(x) * Math.exp(-Math.abs(x) / 5);
      data.push({ x, y });
    }
  } else {
    // 3D surface data
    const size = 20;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const x = (i / size) * 6 - 3;
        const y = (j / size) * 6 - 3;
        const z = Math.sin(Math.sqrt(x * x + y * y)) * Math.exp(-Math.sqrt(x * x + y * y) / 3);
        data.push({ x, y, z });
      }
    }
  }
  
  return data;
}

export function extractGraphParams(controlValues: Record<string, number>): string {
  return Object.entries(controlValues)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
}
