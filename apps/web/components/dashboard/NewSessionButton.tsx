"use client";

import { useRouter } from "next/navigation";
import { createLocalSession } from "./SessionList";
import { motion } from "framer-motion";

export default function NewSessionButton() {
  const router = useRouter();

  const handleCreate = () => {
    const session = createLocalSession();
    router.push(`/playground/${session.id}`);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleCreate}
      className="rounded-xl border border-white bg-white text-black px-6 py-3 font-mono text-sm transition-colors duration-150 ease-in-out hover:bg-white/90"
    >
      New Session
    </motion.button>
  );
}
