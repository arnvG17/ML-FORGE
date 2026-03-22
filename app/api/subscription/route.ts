import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getDb() {
  // Ensure firebase-admin is initialized
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Missing FIREBASE_ADMIN_* env vars");
    }
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

/**
 * GET /api/subscription — check current user's subscription status
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ active: false, plan: "free" });
    }

    const db = getDb();
    const doc = await db.collection("subscriptions").doc(userId).get();

    if (!doc.exists) {
      return NextResponse.json({ active: false, plan: "free" });
    }

    const data = doc.data()!;
    const now = Date.now();
    const isActive = data.expiresAt && data.expiresAt > now;

    return NextResponse.json({
      active: isActive,
      plan: isActive ? "pro" : "free",
      txHash: data.txHash || null,
      paidAt: data.paidAt || null,
      expiresAt: data.expiresAt || null,
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

    // For MVP on Sepolia testnet, we trust the txHash from the client.
    // In production, you'd verify the transaction on-chain:
    // - Check that the tx exists and is confirmed
    // - Check that it sent the correct amount to the correct address
    // - Check that it hasn't been used before

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    const db = getDb();
    await db.collection("subscriptions").doc(userId).set({
      active: true,
      txHash,
      paidAt: now,
      expiresAt: now + thirtyDays,
      userId,
    });

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
