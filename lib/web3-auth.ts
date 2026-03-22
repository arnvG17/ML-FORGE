/**
 * Sign-In with Ethereum (SIWE) helpers — client-side
 */

export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function createSIWEMessage(
  address: string,
  nonce: string,
  chainId: number = 11155111 // Sepolia
): string {
  const domain = typeof window !== "undefined" ? window.location.host : "localhost:3000";
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const issuedAt = new Date().toISOString();

  return `${domain} wants you to sign in with your Ethereum account:
${address}

Sign in to Forge AI

URI: ${origin}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`;
}

/**
 * Calls the server to verify the wallet signature and get a Firebase custom token.
 */
export async function verifyWalletSignature(
  address: string,
  message: string,
  signature: string
): Promise<{ customToken: string }> {
  const res = await fetch("/api/web3-auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, message, signature }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Verification failed" }));
    throw new Error(err.error || "Wallet verification failed");
  }

  return res.json();
}
