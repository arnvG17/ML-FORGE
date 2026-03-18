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

/**
 * Filters the LLM context to keep early intent and recent messages.
 */
export function trimContext(
  context: Array<{ role: string; content: string }>,
  maxMessages: number = 10
): Array<{ role: string; content: string }> {
  if (context.length <= maxMessages) return context;
  return [
    ...context.slice(0, 2),
    {
      role: "user",
      content: "[Earlier conversation trimmed for length]",
    },
    ...context.slice(-6),
  ];
}

async function* streamGroq(
  prompt: string,
  start: number,
  context: Array<{ role: string; content: string }> = [],
  systemPrompt: string = PYODIDE_SYSTEM_PROMPT
) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is missing");

  console.log("[LLM] Attempting Groq (llama-3.3-70b-versatile)...");
  const groq = new Groq({ apiKey });

  const messages: any[] = [{ role: "system", content: systemPrompt }];
  if (context.length > 0) {
    messages.push(...context);
  }
  messages.push({ role: "user", content: prompt });

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    max_tokens: 8192,
    stream: true,
    messages,
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

async function* streamGemini(
  prompt: string,
  start: number,
  context: Array<{ role: string; content: string }> = [],
  systemPrompt: string = PYODIDE_SYSTEM_PROMPT
) {
  const geminiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!geminiKey) throw new Error("No Gemini API keys found");

  console.log("[LLM] Attempting Gemini (gemini-2.0-flash)...");
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
  });

  const history = context.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history,
  });

  const result = await chat.sendMessageStream(prompt);
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
  const apiKey = process.env.GROQ_API_KEY2;
  if (!apiKey) throw new Error("GROQ_API_KEY2 is missing");

  console.log("[LLM] Thinker: Attempting Groq (llama-3.3-70b-versatile) with API KEY 2...");
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
2. Library selection: Identify exactly which parts of scikit-learn, numpy, pandas, or seaborn are needed.
3. UI Design: Design a set of interactive CONTROLS (sliders, selects) that make sense for this specific task. Focus on hyperparameters that directly affect the model's behavior or the visualization.
4. Data Strategy: Decide how to generate or load data (synthetic generation is preferred for one-shot demos).

═ OUTPUT FORMAT ═
Output a concise TECHNICAL PLAN. Focus on:
- ML Approach:     (e.g. "RandomForestClassifier for digit recognition")
- Data Prep: (e.g. "Generate 500 samples of noisy sine waves")
- Controls: (e.g. "Add a slider for 'Noise Level' and 'Sample Count'")
- Visuals: (e.g. "Plot decision boundaries using seaborn and a confusion matrix")
- Interaction Concept: Explain how the sliders will interact with the plots back and forth.

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
3. sns.set_theme(style="dark", palette="muted") — for premium aesthetics
4. Data Persistence Logic:
   # Use globals to cache data and avoid regeneration on slider updates
   if 'my_dataset' not in globals():
       # Generate data here
       # Tip: Use unique names (e.g., 'kmeans_data') so multiple features can co-exist
       pass
5. CONTROLS list
6. Inside a try block:
     - Read parameters from params
     - Train model, generate plots, set forge_result
7. Except block sets forge_result with error

═ THE params DICT ═
Before your code runs, a dict called params will already exist in the Python environment. Read from it like this:
MAX_DEPTH = int(params.get("MAX_DEPTH", 3))
Always provide a sensible default in the .get() call.

═ CONTROLS LIST ═
Declare CONTROLS as a Python list. Every tunable parameter needs a control entry.
Slider shape: {"id": "max_depth", "type": "slider", "label": "Tree Depth", "min": 1, "max": 20, "step": 1, "default": 3, "targets_var": "MAX_DEPTH"}

═ MODEL TRAINING & DATA RULES ═
- IMPORTANT: Reuse data if it exists in globals() to ensure consistency when sliders move, UNLESS the user explicitly asks for new data or a "Random Seed" slider is changed.
- If the user wants variety, suggest adding a "Random Seed" (targets_var: "SEED") slider and use it in random_state.
- Prefer numpy and pandas for data manipulation.

═ PLOT RULES ═
- Write one function per plot. Each returns a base64 string.
- Use seaborn where possible for high-quality visuals.
- fig, ax = plt.subplots(figsize=(8, 6), facecolor='#0a0a0a')
- Apply styling to axis and spines:
    ax.set_facecolor('#0a0a0a')
    ax.tick_params(colors='#888888', labelsize=8)
    for spine in ax.spines.values(): spine.set_color('#333333')
    ax.title.set_color('#ffffff')
    ax.xaxis.label.set_color('#888888')
    ax.yaxis.label.set_color('#888888')
- Never call plt.show(). Always plt.close(fig) at the end.

═ forge_result — THE ONLY OUTPUT ═
forge_result = {
    "metrics": {"Accuracy": float(accuracy)},
    "plots": {"main_plot": make_plot(...)},
    "controls": CONTROLS,
    "explanation": "A high-level technical description focusing on the interaction and the effects of hyperparameters.",
    "errors": []
}
Values in metrics must be float/str, not numpy types. Ensure float() coercion for all numbers.

═ OUTPUT RULES ═
Output raw Python only. No backticks. No markdown. No explanation.
First character must be 'i' (from import).
Do not import flask, fastapi, uvicorn, django.
`;

const MODIFICATION_SYSTEM_PROMPT = `
You are a Python code MODIFICATION agent for Forge.
This code runs inside the user's browser using Pyodide.
There is no server. There is no Flask. There are no HTTP routes.

═ YOUR ONLY JOB ═
You will receive EXISTING working Python code in the conversation history.
The user is asking you to MODIFY that existing code — to add a feature, change behavior, or fix something.

CRITICAL RULES:
1. FOLLOW USER INTENT: If the user asks for a modification or addition, preserve existing features. If the user's new request supersedes an old feature or asks for a total replacement/switch, follow their intent.
2. CACHE INVALIDATION: If you change the data generation logic OR the user asks to "refresh" or "start over," you MUST invalidate the old cache. Either:
   - del globals()['old_data_key'] at the top of the logic.
   - Or use a totally new unique key in globals() for the new data.
3. You MUST return the COMPLETE modified Python script (not just the changed parts).
4. Integrate the new feature naturally into the existing code structure.
5. Keep variable names and function names consistent unless changing them is part of the user's request.
6. Add new controls (sliders, selects) for any new tunable parameters.
7. Make sure forge_result at the end contains the active plots, metrics, and controls relevant to the CURRENT request.

═ FILE STRUCTURE — same as before ═
1. Imports (sklearn, numpy, pandas, matplotlib, seaborn, json, base64, io, textwrap)
2. matplotlib.use('Agg') — must be before any other matplotlib import
3. sns.set_theme(style="dark", palette="muted")
4. Data Persistence Logic (use globals to cache)
5. CONTROLS list (merge old + new controls)
6. try block: Read params, train model, generate plots, set forge_result
7. Except block sets forge_result with error

═ THE params DICT ═
Before your code runs, a dict called params will already exist. Read from it like:
MAX_DEPTH = int(params.get("MAX_DEPTH", 3))
Always provide a sensible default in the .get() call.

═ CONTROLS LIST ═
Declare CONTROLS as a Python list. Keep all existing controls and add new ones.
Slider shape: {"id": "max_depth", "type": "slider", "label": "Tree Depth", "min": 1, "max": 20, "step": 1, "default": 3, "targets_var": "MAX_DEPTH"}
- Suggest adding a "Random Seed" slider (targets_var="SEED") if the user mentions the plots are always the same.

═ PLOT RULES ═
- Keep ALL existing plot functions. Add new ones as needed.
- fig, ax = plt.subplots(figsize=(8, 6), facecolor='#0a0a0a')
- Apply dark styling to axis and spines.
- Never call plt.show(). Always plt.close(fig).

═ forge_result — THE ONLY OUTPUT ═
Must include ALL metrics, ALL plots, ALL controls from the original + your additions.
Values in metrics must be float/str, not numpy types.

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

export function buildRepairPrompt(
  errorMessage: string,
  failedCode: string
): string {
  return `The code produced this error in Pyodide:\n\n` +
    `ERROR:\n${errorMessage}\n\n` +
    `FAILED CODE:\n${failedCode}\n\n` +
    `Fix the error. Return the complete corrected Python ` +
    `file with the same structure. Raw Python only. ` +
    `No backticks. No explanation. forge_result at the ` +
    `end. FORGE_ML_START and FORGE_ML_END markers must ` +
    `be present. Do not change anything that was working.`;
}

export async function* streamPyodideScript(
  intent: string,
  context: Array<{ role: string; content: string }> = []
) {
  const start = Date.now();
  const trimmed = trimContext(context);
  const isModification = trimmed.length > 0;

  if (isModification) {
    // Extract the last assistant code from context to include explicitly
    const lastAssistantMsg = [...trimmed].reverse().find(m => m.role === "assistant");
    const existingCode = lastAssistantMsg?.content || "";

    const modificationPrompt = `Here is the EXISTING working code that the user built:\n\n${existingCode}\n\n` +
      `The user now wants to MODIFY this code. Their request:\n"${intent}"\n\n` +
      `IMPORTANT: Return the COMPLETE modified Python script that includes ALL existing features ` +
      `PLUS the requested changes. Do NOT remove any working functionality. ` +
      `Integrate the new feature into the existing code structure. Raw Python only.`;

    console.log(`[LLM] Modification mode — existing code length: ${existingCode.length}, new intent: "${intent.slice(0, 50)}..."`);

    try {
      yield* streamGroq(modificationPrompt, start, [], MODIFICATION_SYSTEM_PROMPT);
    } catch (e) {
      console.warn(`[LLM] Groq failed. Falling back to Gemini...`);
      yield* streamGemini(modificationPrompt, start, [], MODIFICATION_SYSTEM_PROMPT);
    }
  } else {
    // First prompt — use standard flow
    const prompt = intent;
    console.log(`[LLM] New session mode — intent: "${intent.slice(0, 50)}..."`);

    try {
      yield* streamGroq(prompt, start, trimmed);
    } catch (e) {
      console.warn(`[LLM] Groq failed. Falling back to Gemini...`);
      yield* streamGemini(prompt, start, trimmed);
    }
  }
}

export async function* streamRepairCode(
  errorMessage: string,
  failedCode: string,
  context: Array<{ role: string; content: string }>
): AsyncGenerator<string> {
  const prompt = buildRepairPrompt(errorMessage, failedCode);
  const start = Date.now();
  const trimmed = trimContext(context);

  try {
    yield* streamGroq(prompt, start, trimmed);
  } catch (e) {
    console.warn(`[LLM] Groq failed. Falling back to Gemini...`);
    yield* streamGemini(prompt, start, trimmed);
  }
}

export async function* streamModifiedCode(
  changeRequest: string,
  existingCode: string,
  context: Array<{ role: string; content: string }> = []
): AsyncGenerator<string> {
  const prompt = changeRequest;
  const start = Date.now();
  const trimmed = trimContext(context);

  try {
    yield* streamGroq(prompt, start, trimmed);
  } catch (e) {
    console.warn(`[LLM] Groq failed. Falling back to Gemini...`);
    yield* streamGemini(prompt, start, trimmed);
  }
}

export async function* streamFlaskApp(intent: string) {
  const prompt = FLASK_SYSTEM_PROMPT + "\n\nUser intent: " + intent;
  for await (const token of streamWithFallback(prompt)) {
    yield token;
  }
}

// ═══════════════════════════════════════════════════════════════════
// COMPILER MODE — AI Tutor
// ═══════════════════════════════════════════════════════════════════

const COMPILER_SYSTEM_PROMPT = `
You are an AI coding tutor inside Forge, a Python compiler for
beginners. You explain code by writing NEW Python programs that
run live and produce visible output. Never explain in plain text.

═ ABSOLUTE RULES ═
1. Your entire response must be valid, runnable Python code.
2. All explanations go inside # comments. No prose outside them.
3. First line must start with # describing what you will show.
4. BE PROACTIVE WITH VISUALS: If the user has data or is asking about ML, ALWAYS generate a seaborn/matplotlib plot. "Smarter" tutors show, they don't just tell.
5. Maximum 35 lines. Focused beats comprehensive.
6. The code shares the user's namespace. Use their variable names.
   Check VARIABLES IN SCOPE before writing anything.
7. PLOT AESTHETICS:
   - fig, ax = plt.subplots(figsize=(8, 5), facecolor='#050505')
   - ax.set_facecolor('#050505')
   - ax.tick_params(colors='#444444', labelsize=8)
   - for s in ax.spines.values(): s.set_color('#222222')
   - Use sns.despine() for a cleaner look.

═ WHEN ASKED TO EXPLAIN ═
  Use their actual variables. Show with print() what is inside them.
  If explaining a model, plot the predictions vs actuals.

═ WHEN ASKED WHAT TO ADD NEXT ═
  Write the next logical extension. Show it working with a plot.
  Model trained → show correlation heatmap or residual plot.

═ WHEN CODE HAS AN ERROR ═
  Fix the specific error. Comment every change and why.
  Show the fixed version printing success or plotting a fix validation.

═ AUTO-EXPLAIN (First Run) ═
  Generate a quick visualization of their main data variable.
  If it's a dataframe, show .head() AND a distribution plot.
`;

export async function* streamCompilerResponse(
  userCode: string,
  variables: Array<{ name: string; typeName: string; shape: string }>,
  chatHistory: Array<{ role: string; text: string }>,
  userMessage: string
): AsyncGenerator<string> {
  const variablesStr = variables
    .map((v) => `${v.name}: ${v.typeName} ${v.shape}`)
    .join("\n");

  const recentChat = chatHistory
    .slice(-4)
    .map((m) => `${m.role}: ${m.text}`)
    .join("\n");

  const prompt =
    `USER'S CODE:\n${userCode}\n\n` +
    `VARIABLES IN SCOPE:\n${variablesStr}\n\n` +
    `RECENT CHAT:\n${recentChat}\n\n` +
    `QUESTION:\n${userMessage}`;

  const start = Date.now();
  console.log(`[LLM] Compiler mode — streaming response...`);

  try {
    yield* streamGroq(prompt, start, [], COMPILER_SYSTEM_PROMPT);
  } catch (e) {
    console.warn(`[LLM] Compiler: Groq failed. Falling back to Gemini...`);
    yield* streamGemini(prompt, start, [], COMPILER_SYSTEM_PROMPT);
  }
}
