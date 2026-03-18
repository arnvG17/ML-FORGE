import { streamCompilerResponse } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const requestId = Math.random().toString(36).slice(2, 6).toUpperCase();
  console.log(`[API:${requestId}] POST /api/compiler/stream`);

  try {
    const { userCode, variables = [], chatHistory = [], userMessage } = await req.json();
    console.log(`[API:${requestId}] userMessage: "${(userMessage || "").slice(0, 40)}...", vars: ${variables.length}`);

    if (!userMessage) {
      return new Response("userMessage is required", { status: 400 });
    }

    const stream = streamCompilerResponse(userCode, variables, chatHistory, userMessage);
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          let tokenCount = 0;
          for await (const token of stream) {
            tokenCount++;
            controller.enqueue(encoder.encode(token));
          }
          console.log(`[API:${requestId}] Stream finished. Tokens: ${tokenCount}`);
          controller.close();
        } catch (e: any) {
          console.error(`[API:${requestId}] Stream error:`, e.message);
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
