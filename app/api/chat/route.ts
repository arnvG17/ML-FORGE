import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const systemPrompt = `You are FORGE, a senior Machine Learning Engineer and AI researcher. 
Your goal is to help the user build, debug, and optimize ML models in the ML-Forge playground.
You are technical, concise, and focused on implementation.
Provide Python code (using common libraries like Scikit-learn, PyTorch, or TensorFlow) when asked.
Always maintain a professional but helpful dev-centric persona.`;

  const result = await streamText({
    model: google("models/gemini-1.5-pro-latest"),
    messages,
    system: systemPrompt,
  });

  return result.toTextStreamResponse();
}
