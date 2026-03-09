import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Check, Recycle, Leaf, Cpu, XCircle } from "lucide-react";
import { WasteCategory } from "@/services/classificationService";

interface WasteAnimationProps {
  category: WasteCategory;
}

const categoryConfig: Record<WasteCategory, { color: string; label: string; icon: typeof Recycle; wasteIcon: string }> = {
  recyclable: { color: "#3B82F6", label: "Recyclable", icon: Recycle, wasteIcon: "♻️" },
  "non-recyclable": { color: "#6B7280", label: "Non-Recyclable", icon: XCircle, wasteIcon: "🗑️" },
  organic: { color: "#22C55E", label: "Organic", icon: Leaf, wasteIcon: "🌿" },
  "e-waste": { color: "#EF4444", label: "E-Waste", icon: Cpu, wasteIcon: "⚡" },
};

export const WasteAnimation = ({ category }: WasteAnimationProps) => {
  const [stage, setStage] = useState<"falling" | "sorted" | "complete">("falling");
  const config = categoryConfig[category];

  useEffect(() => {
    const timer1 = setTimeout(() => setStage("sorted"), 1200);
    const timer2 = setTimeout(() => setStage("complete"), 2000);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      {/* Waste item */}
      <motion.div
        initial={{ y: -100, opacity: 0, rotate: -15 }}
        animate={stage === "falling" ? { y: 60, opacity: 1, rotate: 15 } : { y: 120, opacity: 0, scale: 0.3 }}
        transition={{ duration: stage === "falling" ? 1 : 0.4, ease: stage === "falling" ? "easeIn" : "easeOut" }}
        className="absolute z-10"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted shadow-lg text-3xl">
          {config.wasteIcon}
        </div>
      </motion.div>

      {/* Bin */}
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="relative mt-24">
        <motion.div
          animate={stage === "sorted" ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.3 }}
          style={{ backgroundColor: config.color }}
          className="relative flex h-32 w-24 flex-col items-center justify-end rounded-b-2xl rounded-t-lg shadow-lg"
        >
          <motion.div
            initial={{ rotateX: 0 }}
            animate={stage === "falling" ? { rotateX: -45, originY: 1 } : { rotateX: 0, originY: 1 }}
            transition={{ duration: 0.3 }}
            style={{ backgroundColor: config.color }}
            className="absolute -top-3 h-4 w-28 rounded-t-lg shadow-md"
          />
          <Trash2 className="mb-4 h-8 w-8 text-white/80" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-3 text-center">
          <span className="rounded-full px-4 py-1 text-sm font-semibold text-white" style={{ backgroundColor: config.color }}>
            {config.label}
          </span>
        </motion.div>
      </motion.div>

      {/* Success */}
      {stage === "complete" && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute top-12 flex h-16 w-16 items-center justify-center rounded-full bg-eco-forest shadow-lg"
        >
          <Check className="h-8 w-8 text-white" />
        </motion.div>
      )}

      {/* Confetti */}
      {stage === "complete" && (
        <>
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, scale: 0 }}
              animate={{ x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200, scale: [0, 1, 0], rotate: Math.random() * 360 }}
              transition={{ duration: 1, ease: "easeOut", delay: i * 0.05 }}
              className="absolute top-24 h-2 w-2 rounded-full"
              style={{ backgroundColor: i % 2 === 0 ? config.color : "#22C55E" }}
            />
          ))}
        </>
      )}
    </div>
  );
};
