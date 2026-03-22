import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-server";
import { getCollection } from "@/lib/mongodb";

/**
 * GET /api/subscription — check current user's subscription status
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ active: false, plan: "free" });
    }

    const subscriptions = await getCollection("subscriptions");
    const doc = await subscriptions.findOne({ userId });

    if (!doc) {
      return NextResponse.json({ active: false, plan: "free" });
    }

    const now = Date.now();
    const isActive = doc.expiresAt && doc.expiresAt > now;

    return NextResponse.json({
      active: isActive,
      plan: isActive ? "pro" : "free",
      txHash: doc.txHash || null,
      paidAt: doc.paidAt || null,
      expiresAt: doc.expiresAt || null,
    });
  } catch (error: any) {
    console.error("[subscription] GET error:", error);
    return NextResponse.json({ active: false, plan: "free" });
  }
}

/**
 * POST /api/subscription — record a subscription payment
 * Body: { txHash: string }
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { txHash } = await req.json();
    if (!txHash || typeof txHash !== "string") {
      return NextResponse.json(
        { error: "Missing txHash" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    const subscriptions = await getCollection("subscriptions");
    
    await subscriptions.updateOne(
      { userId },
      {
        $set: {
          active: true,
          txHash,
          paidAt: now,
          expiresAt: now + thirtyDays,
          userId,
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      active: true,
      plan: "pro",
      txHash,
      paidAt: now,
      expiresAt: now + thirtyDays,
    });
  } catch (error: any) {
    console.error("[subscription] POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record subscription" },
      { status: 500 }
    );
  }
}
