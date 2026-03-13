import { streamPyodideScript, streamFlaskApp, thinkAboutIntent } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const requestId = Math.random().toString(36).slice(2, 6).toUpperCase();
  console.log(`[API:${requestId}] POST /api/pyodide/stream`);

  try {
    const { intent, mode } = await req.json();
    console.log(`[API:${requestId}] Intent: "${intent.slice(0, 30)}...", Mode: ${mode}`);

    if (!intent) {
      console.warn(`[API:${requestId}] Missing intent`);
      return new Response("Intent is required", { status: 400 });
    }

    let plan = "";
    if (mode === "browser") {
      console.log(`[API:${requestId}] Stage 1: Thinking...`);
      plan = await thinkAboutIntent(intent);
      console.log(`[API:${requestId}] Technical Plan:\n${plan}`);
    }

    console.log(`[API:${requestId}] Stage 2: Streaming Code...`);
    const stream = mode === "server" 
      ? streamFlaskApp(intent) 
      : streamPyodideScript(intent, plan);
    
    const encoder = new TextEncoder();
    console.log(`[API:${requestId}] Initializing stream...`);

    const readable = new ReadableStream({
      async start(controller) {
        try {
          let tokenCount = 0;
          for await (const token of stream) {
            tokenCount++;
            controller.enqueue(encoder.encode(token));
          }
          console.log(`[API:${requestId}] Stream finished. Tokens sent: ${tokenCount}`);
          controller.close();
        } catch (e: any) {
          console.error(`[API:${requestId}] Stream error during iteration:`, e.message);
          controller.error(e);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error(`[API:${requestId}] Fatal error:`, error.message);
    return new Response(error.message || "Internal Server Error", { status: 500 });
  }
}
