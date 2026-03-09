import { motion } from "framer-motion";
import { LucideIcon, Star, ChevronRight, Clock, Users, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface ChallengeCardProps {
  title: string;
  description: string;
  points: number;
  icon: LucideIcon;
  color: string;
  progress?: number;
  index: number;
}

const challengeDetails: Record<string, { duration: string; participants: string; location: string; steps: string[] }> = {
  "Eco-Reporting": {
    duration: "Ongoing",
    participants: "2.3k active",
    location: "Your area",
    steps: [
      "Spot illegal dumping or littering in your area",
      "Take a photo with the EcoLens camera",
      "Submit the report with location details",
      "Earn points when the report is verified",
    ],
  },
  "Green Habits": {
    duration: "30 days",
    participants: "5.1k active",
    location: "Anywhere",
    steps: [
      "Log at least one eco-friendly activity daily",
      "Activities: recycling, composting, reusing items",
      "Maintain a streak for bonus points",
      "Complete 30 days to earn the full reward",
    ],
  },
  "Plant Care": {
    duration: "Ongoing",
    participants: "1.8k active",
    location: "Home / Garden",
    steps: [
      "Register your plants in the app",
      "Upload weekly growth photos",
      "Log watering and care activities",
      "Earn badges as your plants thrive",
    ],
  },
};

export const ChallengeCard = ({
  title,
  description,
  points,
  icon: Icon,
  color,
  progress = 0,
  index,
}: ChallengeCardProps) => {
  const [open, setOpen] = useState(false);
  const details = challengeDetails[title];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className="glass-card overflow-hidden rounded-2xl cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className={`rounded-xl bg-gradient-to-br ${color} p-3 shadow-lg`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  <span className="text-xs font-semibold text-primary">{points}</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          {progress > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className={`h-full rounded-full bg-gradient-to-r ${color}`}
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              className="group gap-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            >
              {progress > 0 ? "Continue" : "View Details"}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} shadow-lg`}>
              <Icon className="h-7 w-7 text-white" />
            </div>
            <DialogTitle className="text-center text-xl">{title}</DialogTitle>
            <p className="text-center text-sm text-muted-foreground">{description}</p>
          </DialogHeader>

          <div className="flex justify-center gap-4 py-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="font-medium">{points} pts</span>
            </div>
            {details && (
              <>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{details.duration}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{details.participants}</span>
                </div>
              </>
            )}
          </div>

          {progress > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Your Progress</span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {details && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">How to participate</h4>
              <ol className="space-y-2">
                {details.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
