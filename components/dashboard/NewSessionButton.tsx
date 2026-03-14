"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function NewSessionButton() {
  const router = useRouter();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => router.push("/playground/new")}
      className="border border-white text-white px-6 py-3 font-mono text-sm transition-colors duration-150 ease-in-out hover:bg-white hover:text-black"
    >
      New Session
    </motion.button>
  );
}
