import { NextRequest, NextResponse } from "next/server";
import { getPublicGallery, searchPublicSessions, getCollection } from "@/lib/session-db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const sort = req.nextUrl.searchParams.get("sort") || "top";
  
  if (q) {
    const sessions = await searchPublicSessions(q);
    return NextResponse.json(sessions);
  }
  
  const col = await getCollection("sessions");
  const query: any = { visibility: "public" };
  const sortOption: any = sort === "top" ? { rating: -1, forkCount: -1 } : { updatedAt: -1 };
  
  const sessions = await col
    .find(query, {
      projection: {
        sessionId: 1,
        shareToken: 1,
        name: 1,
        intent: 1,
        lastMetrics: 1,
        forkCount: 1,
        rating: 1,
        ratingCount: 1,
        updatedAt: 1,
        likes: 1,
        creatorName: 1,
        creatorImage: 1,
        sessionMode: 1,
      },
    })
    .sort(sortOption)
    .limit(20)
    .toArray();

  return NextResponse.json(sessions);
}
