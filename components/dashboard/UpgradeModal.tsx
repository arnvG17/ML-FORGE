"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useEstimateGas, useGasPrice } from "wagmi";
import { parseEther, formatEther } from "viem";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { checkSubscription, recordSubscriptionPayment, SUBSCRIPTION_AMOUNT, SUBSCRIPTION_DURATION_DAYS } from "@/lib/subscription";
import { useSearchParams } from "next/navigation";
import { mutate } from "swr";

const PAYMENT_RECEIVER = (process.env.NEXT_PUBLIC_PAYMENT_RECEIVER || "0x0000000000000000000000000000000000000000") as `0x${string}`;

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

type ModalStep = "plan" | "billing" | "processing" | "receipt";
type ProcessingPhase = "wallet" | "chain" | "recording";

export function UpgradeModal() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const upgradeParam = searchParams.get("upgrade");
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [isOpen, setIsOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [modalStep, setModalStep] = useState<ModalStep>("plan");
  const [processingPhase, setProcessingPhase] = useState<ProcessingPhase>("wallet");
  const [errorMsg, setErrorMsg] = useState("");

  // Receipt data
  const [receiptData, setReceiptData] = useState<{
    txHash: string;
    paidAt: number;
    expiresAt: number;
    orderId: string;
  } | null>(null);

  const { data: txHash, sendTransaction, isPending: isSendPending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isSelfPayment = isConnected && address?.toLowerCase() === PAYMENT_RECEIVER.toLowerCase();
  const isZeroAddress = PAYMENT_RECEIVER === "0x0000000000000000000000000000000000000000";

  // Gas estimation
  const txParams = {
    to: PAYMENT_RECEIVER,
    value: parseEther(SUBSCRIPTION_AMOUNT),
  };
  const { data: estimatedGas } = useEstimateGas(isConnected && !isZeroAddress ? txParams : undefined);
  const { data: gasPrice } = useGasPrice();

  const gasEstimateEth = (estimatedGas && gasPrice)
    ? formatEther(estimatedGas * gasPrice)
    : null;

  const totalEstimateEth = gasEstimateEth
    ? (parseFloat(SUBSCRIPTION_AMOUNT) + parseFloat(gasEstimateEth)).toFixed(6)
    : null;

  // Check subscription on mount
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    checkSubscription().then((sub) => {
      setIsPro(sub.active);
      if (!sub.active) {
        if (upgradeParam === "true") {
          setIsOpen(true);
        } else {
          const timer = setTimeout(() => setIsOpen(true), 1500);
          return () => clearTimeout(timer);
        }
      }
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, [user, upgradeParam]);

  // Handle transaction confirmation
  useEffect(() => {
    // If we have txHash, optimistic UI update without waiting for on-chain confirmation
    if (txHash && processingPhase === "chain") {
      setProcessingPhase("recording");
      recordSubscriptionPayment(txHash)
        .then((result) => {
          const now = Date.now();
          setReceiptData({
            txHash,
            paidAt: result.paidAt || now,
            expiresAt: result.expiresAt || now + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000,
            orderId: `FORGE-${Date.now().toString(36).toUpperCase()}`,
          });
          setIsPro(true);
          setModalStep("receipt");
          mutate("/api/subscription");
        })
        .catch((err) => {
          setErrorMsg(err.message || "Failed to record payment");
          setModalStep("billing");
        });
    }
  }, [txHash, processingPhase]);

  // Track send → confirming transition
  useEffect(() => {
    if (txHash && processingPhase === "wallet") {
      setProcessingPhase("chain");
    }
  }, [txHash, processingPhase]);

  const handleProceedToCheckout = useCallback(() => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    setErrorMsg("");
    setModalStep("billing");
  }, [isConnected, openConnectModal]);

  const handleConfirmPay = useCallback(async () => {
    setErrorMsg("");
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    try {
      setModalStep("processing");
      setProcessingPhase("wallet");
      sendTransaction({
        to: PAYMENT_RECEIVER,
        value: parseEther(SUBSCRIPTION_AMOUNT),
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Transaction failed");
      setModalStep("billing");
    }
  }, [isConnected, openConnectModal, sendTransaction]);

  const handleClose = () => {
    if (modalStep === "processing") return;
    setIsOpen(false);
    setModalStep("plan");
    setErrorMsg("");
  };

  if (!user || isPro || isLoading) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center px-4"
          >
            <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header bar */}
              <div className="h-1 w-full bg-zinc-800" />

              {/* Step indicator */}
              <div className="px-8 pt-6 pb-2">
                <div className="flex items-center justify-between mb-1">
                  {["Plan", "Billing", "Payment", "Receipt"].map((label, i) => {
                    const steps: ModalStep[] = ["plan", "billing", "processing", "receipt"];
                    const currentIdx = steps.indexOf(modalStep);
                    const isActive = i === currentIdx;
                    const isDone = i < currentIdx;
                    return (
                      <div key={label} className="flex items-center gap-1 flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border transition-all duration-300 ${
                          isDone ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" :
                          isActive ? "bg-white text-black border-white" :
                          "bg-zinc-900 border-zinc-800 text-zinc-500"
                        }`}>
                          {isDone ? "✓" : i + 1}
                        </div>
                        <span className={`text-[9px] font-mono uppercase tracking-wider ${
                          isActive ? "text-white" : isDone ? "text-emerald-400/70" : "text-zinc-600"
                        }`}>{label}</span>
                        {i < 3 && <div className={`flex-1 h-px mx-1 ${isDone ? "bg-emerald-500/30" : "bg-white/5"}`} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-8 pt-4">
                {/* Close button */}
                {modalStep !== "processing" && (
                  <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 text-zinc-600 hover:text-white transition-colors z-10"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                <AnimatePresence mode="wait">
                  {/* ─── STEP 1: Plan Selection ─── */}
                  {modalStep === "plan" && (
                    <motion.div key="plan" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full mb-4">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          <span className="text-[10px] font-mono text-white uppercase tracking-widest">Upgrade Available</span>
                        </div>
                        <h3 className="font-comico text-3xl text-white tracking-tight">Unlock Full Power</h3>
                        <p className="text-sm font-mono text-zinc-500 mt-2">Get unlimited AI generations, advanced models, and more.</p>
                      </div>

                      <div className="text-center mb-5 py-4 bg-white/[0.03] border border-white/5 rounded-xl">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-mono font-bold text-white">{SUBSCRIPTION_AMOUNT}</span>
                          <span className="text-sm font-mono text-zinc-500">ETH / month</span>
                        </div>
                        <p className="text-[10px] font-mono text-zinc-600 mt-1">Sepolia Testnet • Test ETH only</p>
                      </div>

                      <ul className="space-y-2 mb-6">
                        {["Unlimited AI code generations", "Advanced model architectures", "Priority execution queue", "Export models to production", "AI-powered code chat assistant"].map((f) => (
                          <li key={f} className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs font-mono text-zinc-400">{f}</span>
                          </li>
                        ))}
                      </ul>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleProceedToCheckout}
                        className="w-full py-4 rounded-xl bg-white text-black font-mono font-semibold text-sm tracking-wide transition-all duration-200 hover:bg-zinc-200 flex items-center justify-center gap-2 border border-white"
                      >
                        {isConnected ? "Proceed to Checkout →" : "Connect Wallet to Continue"}
                      </motion.button>

                      <button onClick={handleClose} className="w-full mt-3 py-2 text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors">
                        Continue with Free plan →
                      </button>
                    </motion.div>
                  )}

                  {/* ─── STEP 2: Billing Summary ─── */}
                  {modalStep === "billing" && (
                    <motion.div key="billing" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                      <div className="text-center mb-6">
                        <h3 className="font-comico text-2xl text-white tracking-tight">Billing Summary</h3>
                        <p className="text-xs font-mono text-zinc-500 mt-1">Review your order before payment</p>
                      </div>

                      {/* Invoice */}
                      <div className="mb-8 space-y-4">
                        {/* Order Item */}
                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                          <div>
                            <p className="text-sm font-mono font-semibold text-white tracking-widest uppercase">Forge Pro</p>
                            <p className="text-[10px] font-mono text-zinc-500 mt-1">{SUBSCRIPTION_DURATION_DAYS}-Day Access</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-mono text-white">{SUBSCRIPTION_AMOUNT} ETH</p>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-zinc-600">Network</span>
                            <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                              Sepolia
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-zinc-600">From</span>
                            <span className="text-xs font-mono text-zinc-300">{address ? truncateAddress(address) : "Not connected"}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-zinc-600">To</span>
                            <span className="text-xs font-mono text-zinc-300">{truncateAddress(PAYMENT_RECEIVER)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-zinc-600">Est. Gas</span>
                            <span className="text-xs font-mono text-zinc-400">
                              {gasEstimateEth
                                ? `~${parseFloat(gasEstimateEth).toFixed(6)} ETH`
                                : <span className="inline-flex items-center gap-1"><span className="w-3 h-3 border border-zinc-600 border-t-zinc-400 animate-spin rounded-full" /></span>
                              }
                            </span>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <span className="text-sm font-mono text-zinc-400">Total</span>
                          <div className="text-right">
                            <span className="text-lg font-mono text-white">
                              {totalEstimateEth ? `${totalEstimateEth} ETH` : `${SUBSCRIPTION_AMOUNT} ETH + gas`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Warnings */}
                      {isSelfPayment && (
                        <div className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4 flex items-start gap-2">
                          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span>Warning: You are sending ETH to your own wallet. Set a different <code className="text-amber-300">NEXT_PUBLIC_PAYMENT_RECEIVER</code> address.</span>
                        </div>
                      )}
                      {isZeroAddress && (
                        <div className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 flex items-start gap-2">
                          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 11-12.728 0 9 9 0 0112.728 0zM12 9v2m0 4h.01" />
                          </svg>
                          <span>Payment receiver is not configured. Please set <code className="text-red-300">NEXT_PUBLIC_PAYMENT_RECEIVER</code> in your environment.</span>
                        </div>
                      )}

                      {/* Error */}
                      {errorMsg && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                          {errorMsg}
                        </motion.div>
                      )}

                      <div className="flex gap-3">
                        <button onClick={() => { setModalStep("plan"); setErrorMsg(""); }} className="flex-1 py-3.5 rounded-xl border border-white/10 text-zinc-400 font-mono text-sm hover:bg-white/5 transition-colors">
                          ← Back
                        </button>
                        <motion.button
                          whileHover={{ scale: isZeroAddress ? 1 : 1.02 }}
                          whileTap={{ scale: isZeroAddress ? 1 : 0.98 }}
                          onClick={handleConfirmPay}
                          disabled={isZeroAddress}
                          className="flex-[2] py-3.5 rounded-xl bg-white text-black font-mono font-semibold text-sm tracking-wide transition-all duration-200 hover:bg-zinc-200 disabled:opacity-40 flex items-center justify-center gap-2 border border-white"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity={0.3}/>
                            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Confirm &amp; Pay {SUBSCRIPTION_AMOUNT} ETH
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* ─── STEP 3: Processing ─── */}
                  {modalStep === "processing" && (
                    <motion.div key="processing" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                      <div className="text-center mb-8">
                        <h3 className="font-comico text-2xl text-white tracking-tight">Processing Payment</h3>
                        <p className="text-xs font-mono text-zinc-500 mt-1">Please do not close this window</p>
                      </div>

                      <div className="space-y-4 mb-8">
                        {[
                          { phase: "wallet" as ProcessingPhase, label: "Waiting for wallet confirmation", desc: "Approve the transaction in MetaMask" },
                          { phase: "chain" as ProcessingPhase, label: "Confirming on blockchain", desc: "Transaction is being validated on Sepolia" },
                          { phase: "recording" as ProcessingPhase, label: "Recording subscription", desc: "Saving your Pro status to Forge" },
                        ].map((item, i) => {
                          const phases: ProcessingPhase[] = ["wallet", "chain", "recording"];
                          const currentIdx = phases.indexOf(processingPhase);
                          const itemIdx = phases.indexOf(item.phase);
                          const isActive = itemIdx === currentIdx;
                          const isDone = itemIdx < currentIdx;
                          return (
                            <div key={item.phase} className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-500 ${
                              isActive ? "bg-zinc-900 border-zinc-700" :
                              isDone ? "bg-emerald-500/5 border-emerald-500/20" :
                              "bg-zinc-950 border-zinc-900"
                            }`}>
                              <div className="mt-0.5">
                                {isDone ? (
                                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                ) : isActive ? (
                                  <div className="w-6 h-6 border-2 border-zinc-600 border-t-white animate-spin rounded-full" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-mono text-zinc-600">
                                    {i + 1}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className={`text-sm font-mono font-medium ${isActive ? "text-white" : isDone ? "text-emerald-400" : "text-zinc-600"}`}>
                                  {item.label}
                                </p>
                                <p className={`text-[10px] font-mono ${isActive ? "text-zinc-400" : isDone ? "text-emerald-400/50" : "text-zinc-700"}`}>
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {txHash && (
                        <div className="text-center">
                          <p className="text-[10px] font-mono text-zinc-600">
                            Tx: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors">{truncateAddress(txHash)}</a>
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ─── STEP 4: Receipt ─── */}
                  {modalStep === "receipt" && receiptData && (
                    <motion.div key="receipt" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                      <div className="text-center mb-6">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", damping: 12, delay: 0.1 }}
                          className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-emerald-500/10"
                        >
                          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                        <h3 className="font-comico text-2xl text-white tracking-tight">Payment Successful!</h3>
                        <p className="text-xs font-mono text-zinc-500 mt-1">You&apos;re now a Forge Pro member 🎉</p>
                      </div>

                      {/* Receipt Card */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl divide-y divide-white/5 mb-6">
                        <div className="p-4 text-center">
                          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em]">Transaction Receipt</p>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                          <span className="text-xs font-mono text-zinc-500">Order ID</span>
                          <span className="text-xs font-mono text-zinc-300">{receiptData.orderId}</span>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                          <span className="text-xs font-mono text-zinc-500">Date</span>
                          <span className="text-xs font-mono text-zinc-300">{formatDate(receiptData.paidAt)}</span>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                          <span className="text-xs font-mono text-zinc-500">Amount Paid</span>
                          <span className="text-xs font-mono text-emerald-400 font-bold">{SUBSCRIPTION_AMOUNT} ETH</span>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                          <span className="text-xs font-mono text-zinc-500">Plan</span>
                          <span className="text-xs font-mono text-white font-bold">Pro</span>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                          <span className="text-xs font-mono text-zinc-500">Valid Until</span>
                          <span className="text-xs font-mono text-zinc-300">{formatDate(receiptData.expiresAt)}</span>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                          <span className="text-xs font-mono text-zinc-500">Tx Hash</span>
                          <a
                            href={`https://sepolia.etherscan.io/tx/${receiptData.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-zinc-400 hover:text-white underline underline-offset-2 transition-colors"
                          >
                            {truncateAddress(receiptData.txHash)}
                          </a>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <a
                          href={`https://sepolia.etherscan.io/tx/${receiptData.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-3.5 rounded-xl border border-white/10 text-zinc-400 font-mono text-sm hover:bg-white/5 transition-colors text-center flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Etherscan
                        </a>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleClose}
                          className="flex-[2] py-3.5 rounded-xl bg-emerald-500 text-black font-mono font-semibold text-sm tracking-wide transition-all duration-200 hover:bg-emerald-400"
                        >
                          Start Building →
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
