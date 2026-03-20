import { getCompilerResponse } from "@/lib/llm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    console.log(`[CompilerChat API] [${startTime}] Request received:`, JSON.stringify(body).slice(0, 200) + "...");
    
    const { userCode, userMessage, variables, lastOutput } = body;

    if (!userCode || !userMessage) {
      return NextResponse.json(
        { error: "Missing required fields: userCode or userMessage" },
        { status: 400 }
      );
    }

    const response = await getCompilerResponse(
      userCode,
      userMessage,
      variables || "",
      lastOutput || ""
    );

    console.log(`[CompilerChat API] [${startTime}] Success in ${Date.now() - startTime}ms`);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error(`[CompilerChat API] [${startTime}] CRITICAL ERROR:`, error.message);
    if (error.stack) console.error(error.stack);
    
    return NextResponse.json(
      { 
        error: error.message || "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
