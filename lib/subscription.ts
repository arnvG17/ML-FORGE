/**
 * Client-side subscription helpers for ETH payment flow
 */

export const SUBSCRIPTION_AMOUNT = "0.0001"; // ETH
export const SUBSCRIPTION_DURATION_DAYS = 30;

export interface SubscriptionStatus {
  active: boolean;
  txHash?: string;
  paidAt?: number;
  expiresAt?: number;
  plan: "free" | "pro";
}

/**
 * Check the current user's subscription status
 */
export async function checkSubscription(): Promise<SubscriptionStatus> {
  try {
    const res = await fetch("/api/subscription");
    if (!res.ok) {
      return { active: false, plan: "free" };
    }
    return res.json();
  } catch {
    return { active: false, plan: "free" };
  }
}

/**
 * Record a subscription payment (after user sends ETH)
 */
export async function recordSubscriptionPayment(txHash: string): Promise<SubscriptionStatus> {
  const res = await fetch("/api/subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txHash }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to record payment" }));
    throw new Error(err.error || "Failed to record subscription");
  }

  return res.json();
}
