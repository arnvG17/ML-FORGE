import { streamPyodideScript } from "@/lib/llm";
import { extractMLCode } from "@/lib/extractMLCode";
import { NextResponse } from "next/server";

// export const runtime = "edge";

export async function GET() {
  try {
    const generator = streamPyodideScript(
      "build a decision tree classifier on the iris dataset"
    );

    let fullGeneratedCode = "";
    for await (const token of generator) {
      fullGeneratedCode += token;
    }

    const extractedCode = extractMLCode(fullGeneratedCode);

    const checkRegex = (pattern: RegExp) => pattern.test(extractedCode);
    const checkString = (str: string) => extractedCode.includes(str);

    const hasForgeResult = checkString("forge_result = ");
    const hasFlask = checkString("import Flask") || checkString("from flask");
    const hasAppRun = checkString("app.run(");
    const hasParams = checkString("params.get(");
    const hasControls = checkString("CONTROLS");

    const success =
      hasForgeResult && !hasFlask && !hasAppRun && hasParams && hasControls;

    return NextResponse.json({
      success,
      totalCharacters: extractedCode.length,
      hasForgeResult,
      hasFlask,
      hasAppRun,
      hasParams,
      hasControls,
      extractedCode,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
