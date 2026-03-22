# Web3 Integration — Forge AI

## Overview

Forge uses **MetaMask wallet authentication** and **ETH-based subscriptions** (Sepolia testnet) alongside existing Firebase/Google auth. Users can sign in with their wallet and pay a monthly fee in test ETH to unlock Pro features.

---

## Architecture

```
User visits Forge
  → Connects MetaMask (wallet = their identity)
    → Signs a SIWE message (proves wallet ownership, no gas fee)
      → Server verifies signature with viem
        → Firebase account created/linked to wallet address (UID: wallet_0x...)
          → Dashboard shows upgrade modal
            → User pays 0.001 ETH on Sepolia
              → Payment recorded in Firestore
                → Full AI access granted ✅
```

---

## Tech Stack

| Package | Purpose |
|---------|---------|
| `wagmi` | React hooks for Ethereum (wallet connection, transactions) |
| `viem` | Low-level Ethereum utilities (signature verification, tx parsing) |
| `@rainbow-me/rainbowkit` | Pre-built wallet connection UI |
| `@tanstack/react-query` | Async state management (required by wagmi) |
| `firebase-admin` | Server-side user creation + Firestore for subscriptions |

---

## File Map

### Config & Providers
- **`lib/wagmi.ts`** — Wagmi config (Sepolia chain, RainbowKit defaults)
- **`components/Web3Provider.tsx`** — Wraps app with WagmiProvider + RainbowKitProvider
- **`app/layout.tsx`** — Web3Provider sits inside FirebaseAuthProvider

### Authentication
- **`lib/web3-auth.ts`** — Client helpers: SIWE message creation, nonce generation, server call
- **`app/api/web3-auth/route.ts`** — Server: verify signature → create Firebase user → return custom token
- **`lib/auth.tsx`** — `signInWithWallet()` signs into Firebase with the custom token; `walletAddress` exposed via context

### Subscription
- **`lib/subscription.ts`** — Client helpers: check status, record payment
- **`app/api/subscription/route.ts`** — Server: GET reads Firestore, POST saves txHash + 30-day expiry

### UI
- **`app/sign-in/page.tsx`** — MetaMask button (primary) + Google button (secondary)
- **`components/landing/PricingSection.tsx`** — Free vs Pro pricing cards on landing page
- **`components/dashboard/UpgradeModal.tsx`** — Auto-shows on dashboard for non-subscribers; handles full ETH payment lifecycle
- **`components/layout/Navbar.tsx`** — Shows truncated wallet address + Pricing link

### Route Protection
- **`middleware.ts`** — Redirects unauthenticated users to `/sign-in`; subscription checks happen at the component level

---

## Firestore Schema

```
subscriptions/
  {userId}/              ← "wallet_0xabc..." or Firebase UID
    active: boolean
    txHash: "0x..."
    paidAt: timestamp
    expiresAt: timestamp  ← 30 days from payment
    userId: string
```

---

## Freemium Model

| Feature | Free | Pro (0.001 ETH/mo) |
|---------|------|---------------------|
| Browser Python execution | ✅ | ✅ |
| Basic ML generation | ✅ | ✅ |
| Community playgrounds | ✅ | ✅ |
| AI generations | 3/day | Unlimited |
| Advanced architectures | ❌ | ✅ |
| Priority execution | ❌ | ✅ |
| Export to production | ❌ | ✅ |
| AI code chat | ❌ | ✅ |

---

## Auth Flow Detail

### 1. Wallet Connection
User clicks "Connect with MetaMask" → RainbowKit modal opens → wallet connected via wagmi.

### 2. SIWE Signature
A Sign-In with Ethereum message is created (domain, address, nonce, chain ID) and signed by the user in MetaMask. **No gas fee** — it's just a cryptographic signature.

### 3. Server Verification
`POST /api/web3-auth` receives `{ address, message, signature }`:
- Verifies signature using `viem.verifyMessage()`
- Creates or finds Firebase user with UID `wallet_{address}`
- Returns a Firebase custom token

### 4. Firebase Sign-In
Client calls `signInWithCustomToken()` with the custom token → session cookie set → user is authenticated.

---

## Payment Flow Detail

### 1. Check Subscription
On dashboard mount, `GET /api/subscription` checks Firestore for an active subscription.

### 2. Show Upgrade Modal
If no active subscription → modal appears after 1.5s delay with Pro features and payment button.

### 3. Send ETH
User clicks "Pay 0.001 ETH" → wagmi's `sendTransaction()` sends ETH to `NEXT_PUBLIC_PAYMENT_RECEIVER` on Sepolia.

### 4. Record Payment
After on-chain confirmation, `POST /api/subscription` saves `{ txHash, paidAt, expiresAt }` to Firestore.

---

## Environment Variables

```env
# WalletConnect Cloud project ID (get from cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id

# Wallet address that receives subscription payments
NEXT_PUBLIC_PAYMENT_RECEIVER=0xYourAddressHere
```

---

## Testing

1. Install MetaMask browser extension
2. Switch to Sepolia testnet
3. Get test ETH from [sepoliafaucet.com](https://sepoliafaucet.com)
4. Run `pnpm run dev`
5. Visit `/sign-in` → Connect MetaMask → Sign message
6. Visit `/dashboard` → Upgrade modal appears → Pay 0.001 test ETH
7. Access granted ✅

---

## Production Checklist

- [ ] Replace Sepolia with mainnet in `lib/wagmi.ts`
- [ ] Set real `NEXT_PUBLIC_PAYMENT_RECEIVER` address
- [ ] Get production WalletConnect project ID
- [ ] Add on-chain tx verification in `POST /api/subscription` (verify amount, recipient, confirmation count)
- [ ] Add rate limiting to `/api/web3-auth`
- [ ] Add duplicate txHash check to prevent replay
