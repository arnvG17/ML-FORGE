import { getCompilerResponse } from "@/lib/llm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[CompilerChat API] Received body:", JSON.stringify(body, null, 2));
    const { userCode, userMessage, variables, lastOutput } = body;

    if (!userCode || !userMessage) {
      console.warn("[CompilerChat API] Missing required fields");
      return NextResponse.json(
        { error: "userCode and userMessage are required" },
        { status: 400 }
      );
    }

    console.log("[CompilerChat API] Calling getCompilerResponse...");
    const response = await getCompilerResponse(
      userCode,
      userMessage,
      variables || "",
      lastOutput || ""
    );

    console.log("[CompilerChat API] Success! Response:", JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[CompilerChat API] Error:", error.message, error.stack);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
