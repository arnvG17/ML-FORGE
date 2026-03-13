import { Groq } from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Streams tokens using a preferred provider first, with fallback.
 */
async function* streamWithFallback(prompt: string, preferGemini = false) {
  const start = Date.now();
  console.log("[LLM] Starting streamWithFallback");
  console.log("[LLM] FULL PROMPT:\n", prompt);
  
  if (preferGemini) {
    try {
      yield* streamGemini(prompt, start);
    } catch (e) {
      console.warn(`[LLM] Gemini failed. Falling back to Groq...`);
      yield* streamGroq(prompt, start);
    }
  } else {
    try {
      yield* streamGroq(prompt, start);
    } catch (e) {
      console.warn(`[LLM] Groq failed. Falling back to Gemini...`);
      yield* streamGemini(prompt, start);
    }
  }
}

async function* streamGroq(prompt: string, start: number) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is missing");

  console.log("[LLM] Attempting Groq (llama-3.3-70b-versatile)...");
  const groq = new Groq({ apiKey });
  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    max_tokens: 8192,
    stream: true,
    messages: [{ role: "user", content: prompt }],
  });

  let tokenCount = 0;
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) {
      tokenCount++;
      yield token;
    }
  }
  console.log(`[LLM] Groq stream completed. Tokens: ${tokenCount}, Duration: ${Date.now() - start}ms`);
}

async function* streamGemini(prompt: string, start: number) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!geminiKey) throw new Error("No Gemini API keys found");

  console.log("[LLM] Attempting Gemini (gemini-2.0-flash)...");
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
  });
  
  const result = await model.generateContentStream(prompt);
  let tokenCount = 0;
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      tokenCount++;
      yield text;
    }
  }
  console.log(`[LLM] Gemini stream completed. Tokens: ${tokenCount}, Duration: ${Date.now() - start}ms`);
}

/**
 * Non-streaming fetch for the Thinker stage.
 */
async function thinkWithFallback(prompt: string, preferGemini = false): Promise<string> {
  const start = Date.now();
  console.log("[LLM] Starting thinkWithFallback (preferGemini: " + preferGemini + ")");
  
  if (preferGemini) {
    try {
      return await thinkGemini(prompt, start);
    } catch (e) {
      console.warn(`[LLM] Thinker: Gemini failed. Falling back to Groq...`);
      return await thinkGroq(prompt, start);
    }
  } else {
    try {
      return await thinkGroq(prompt, start);
    } catch (e) {
      console.warn(`[LLM] Thinker: Groq failed. Falling back to Gemini...`);
      return await thinkGemini(prompt, start);
    }
  }
}

async function thinkGroq(prompt: string, start: number): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is missing");

  console.log("[LLM] Thinker: Attempting Groq (llama-3.3-70b-versatile)...");
  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const result = completion.choices[0]?.message?.content || "";
  console.log(`[LLM] Thinker: Groq completed in ${Date.now() - start}ms`);
  return result;
}

async function thinkGemini(prompt: string, start: number): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!geminiKey) throw new Error("No API keys for Gemini");

  console.log("[LLM] Thinker: Attempting Gemini (gemini-2.0-flash)...");
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  
  console.log(`[LLM] Thinker: Gemini completed in ${Date.now() - start}ms`);
  return result.response.text();
}

const THINKER_SYSTEM_PROMPT = `
You are a Senior Machine Learning Architect at Forge.
Your job is to take a raw user intent and transform it into a sophisticated, technically sound execution plan for a browser-based Python (Pyodide) environment.

═ YOUR GOALS ═
1. Expand the idea: Add depth, edge cases, and "cool" features (e.g., if they ask for a chart, think of what metrics deserve a slider).
2. Library selection: Identify exactly which parts of scikit-learn, numpy, or pandas are needed. 
3. UI Design: Design a set of interactive CONTROLS (sliders, selects) that make sense for this specific task.
4. Data Strategy: Decide how to generate or load data (synthetic generation is preferred for one-shot demos).

═ OUTPUT FORMAT ═
Output a concise TECHNICAL PLAN. Focus on:
- ML Approach: (e.g. "RandomForestClassifier for digit recognition")
- Data Prep: (e.g. "Generate 500 samples of noisy sine waves")
- Controls: (e.g. "Add a slider for 'Noise Level' and 'Sample Count'")
- Visuals: (e.g. "Plot decision boundaries and a confusion matrix")

Be specific. Be technical. Do not write code here. Just the plan.
`;

const PYODIDE_SYSTEM_PROMPT = `
You are a Python code generation agent for Forge.
This code will run inside the user's browser using Pyodide.
There is no server. There is no Flask. There are no HTTP routes.

YOUR ONLY JOB:
Write a single self-contained Python script that trains an ML
model, generates plots, and sets a variable called forge_result.

═ FILE STRUCTURE — write in this order ═
1. Imports (sklearn, numpy, pandas, matplotlib, seaborn, json, base64, io, textwrap)
2. matplotlib.use('Agg') — must be before any other matplotlib import
3. CONTROLS list (declared before anything else runs)
4. Data loading (at top level, runs once)
5. Inside a try block:
     - Read parameters from a dict called params
       (this dict will be injected before your code runs)
     - Train the model using constructor parameters
     - Calculate metrics
     - Generate plots
     - Set forge_result
6. Except block sets forge_result with error

═ THE params DICT ═
Before your code runs, a dict called params will already exist in the Python environment. Read from it like this:
MAX_DEPTH = int(params.get("MAX_DEPTH", 3))
Always provide a sensible default in the .get() call.

═ CONTROLS LIST ═
Declare CONTROLS as a Python list at the top. Every tunable parameter needs a control entry.
Slider shape: {"id": "max_depth", "type": "slider", "label": "Tree Depth", "min": 1, "max": 20, "step": 1, "default": 3, "targets_var": "MAX_DEPTH"}

═ MODEL TRAINING & DATA RULES ═
- Always pass hyperparameters in the constructor.
- Always set random_state=42.
- IMPORTANT: sklearn's CountVectorizer ignores 1-character tokens by default. If the user asks for character-level patterns or simple splitting, use CountVectorizer(token_pattern=r"(?u)\\b\\w+\\b") or CountVectorizer(analyzer='char') or simple manual frequency counting.
- Prefer numpy and pandas for data manipulation.

═ PLOT RULES ═
Write one function per plot. Each returns a base64 string.
fig, ax = plt.subplots(figsize=(7, 5))
Apply styling to axis and spines (#0a0a0a, #555555, #222222).
Never call plt.show(). Always plt.close(fig) at the end.

═ forge_result — THE ONLY OUTPUT ═
forge_result = {
    "metrics": {"Accuracy": float(accuracy)},
    "plots": {"confusion_matrix": make_plot(...)},
    "controls": CONTROLS,
    "explanation": "A concise breakdown of the model approach, dataset, and what the visualizations represent.",
    "errors": []
}
Values in metrics must be float/str, not numpy types. Ensure float() coercion for all numbers.

═ OUTPUT RULES ═
Output raw Python only. No backticks. No markdown. No explanation.
First character must be 'i' (from import).
Do not import flask, fastapi, uvicorn, django.
`;

const FLASK_SYSTEM_PROMPT = `
You are a backend Machine Learning engineer building a Flask application.
Write a robust, self-contained Python file acting as a Flask app.
`;

export async function thinkAboutIntent(intent: string) {
  const prompt = THINKER_SYSTEM_PROMPT + "\n\nUser intent: " + intent;
  // Stage 1: Prefer Gemini
  return await thinkWithFallback(prompt, true);
}

export async function* streamPyodideScript(intent: string, plan?: string) {
  const context = plan ? `\n\nTECHNICAL PLAN TO FOLLOW:\n${plan}` : "";
  const prompt = PYODIDE_SYSTEM_PROMPT + context + "\n\nUser intent: " + intent;
  // Stage 2: Prefer Groq
  for await (const token of streamWithFallback(prompt, false)) {
    yield token;
  }
}

export async function* streamFlaskApp(intent: string) {
  const prompt = FLASK_SYSTEM_PROMPT + "\n\nUser intent: " + intent;
  for await (const token of streamWithFallback(prompt)) {
    yield token;
  }
}
