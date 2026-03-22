import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { address, message, signature } = await req.json();

    if (!address || !message || !signature) {
      return NextResponse.json(
        { error: "Missing address, message, or signature" },
        { status: 400 }
      );
    }

    // Verify the signature on-chain using viem
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Create or get the Firebase user with wallet address as UID
    const adminAuth = getAdminAuth();
    const walletUid = `wallet_${address.toLowerCase()}`;

    try {
      await adminAuth.getUser(walletUid);
    } catch {
      // User doesn't exist yet — create them
      await adminAuth.createUser({
        uid: walletUid,
        displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    }

    // Create a custom token for client-side Firebase sign-in
    const customToken = await adminAuth.createCustomToken(walletUid, {
      walletAddress: address.toLowerCase(),
    });

    return NextResponse.json({ customToken });
  } catch (error: any) {
    console.error("[web3-auth] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
