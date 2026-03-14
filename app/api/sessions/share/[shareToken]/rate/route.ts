import { NextRequest, NextResponse } from "next/server";
import { rateSession } from "@/lib/session-db";
import { getCurrentUserId } from "@/lib/auth-server";

interface RouteParams {
  params: { shareToken: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { rating } = await req.json();
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  try {
    const result = await rateSession(params.shareToken, rating);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
