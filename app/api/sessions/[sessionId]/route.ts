import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-server";
import { loadSessionById, updateSession, getCollection } from "@/lib/session-db";

interface RouteParams {
  params: { sessionId: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await loadSessionById(params.sessionId, userId);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(session);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { $set, $push, visibility: _v, ...directFields } = body;

  try {
    await updateSession(params.sessionId, userId, {
      $set: { ...directFields, ...$set },
      $push,
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const col = await getCollection("sessions");
  const doc = await col.findOne({ sessionId: params.sessionId });
  if (!doc || doc.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await col.deleteOne({ sessionId: params.sessionId });
  return NextResponse.json({ success: true });
}
