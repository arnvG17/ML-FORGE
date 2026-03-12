import Link from "next/link";
import { motion } from "framer-motion";

interface SessionCardProps {
  session: {
    id: string;
    name: string;
    status: string;
    last_algorithm: string | null;
    created_at: string;
  };
}

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 }
};

export default function SessionCard({ session }: SessionCardProps) {
  const date = new Date(session.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div variants={item} className="bg-surface/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-primary/20 group hover:-translate-y-1">
      <div className="font-mono text-sm font-semibold mb-2 text-white">
        {session.name}
      </div>
      <div className="text-xs font-light text-muted mb-3">{date}</div>
      {session.last_algorithm && (
        <div className="text-xs font-light text-placeholder font-mono mb-4">
          {session.last_algorithm}
        </div>
      )}
      <Link
        href={`/playground/${session.id}`}
        className="text-xs font-mono font-medium text-primary opacity-80 group-hover:opacity-100 transition-opacity duration-150 inline-flex items-center gap-1"
      >
        Resume <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
      </Link>
    </motion.div>
  );
}
