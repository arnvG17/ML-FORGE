import { NextResponse } from "next/server";
import { searchPublicSessions } from "@/lib/session-db";

export async function GET() {
  const sessions = await searchPublicSessions("");
  return NextResponse.json(sessions);
}
