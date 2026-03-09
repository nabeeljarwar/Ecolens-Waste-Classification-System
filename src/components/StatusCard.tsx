import { motion } from "framer-motion";
import { Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface StatusCardProps {
  pendingCount: number;
}

export const StatusCard = ({ pendingCount }: StatusCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link to="/disposal">
        <div className="glass-card group cursor-pointer overflow-hidden rounded-2xl p-5 transition-all hover:shadow-glow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                {pendingCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground"
                  >
                    {pendingCount}
                  </motion.div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Pending Disposals</h3>
                <p className="text-sm text-muted-foreground">
                  {pendingCount === 0
                    ? "All items verified!"
                    : `${pendingCount} item${pendingCount > 1 ? "s" : ""} awaiting video proof`}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
          
          {pendingCount > 0 && (
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "30%" }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-eco-leaf"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Complete disposals to earn points</p>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};
