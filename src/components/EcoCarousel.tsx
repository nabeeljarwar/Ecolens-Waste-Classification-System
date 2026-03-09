import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Recycle, Droplets, Wind } from "lucide-react";

const ecoFacts = [
  {
    icon: Recycle,
    title: "Plastic Takes 450 Years",
    description: "A plastic bottle takes 450 years to decompose. Recycle to make a difference!",
    color: "from-eco-ocean to-blue-400",
  },
  {
    icon: Leaf,
    title: "One Tree = 260 lbs CO₂",
    description: "A mature tree absorbs about 260 pounds of carbon dioxide per year.",
    color: "from-eco-forest to-eco-leaf",
  },
  {
    icon: Droplets,
    title: "Save Water, Save Life",
    description: "Recycling one ton of paper saves 7,000 gallons of water.",
    color: "from-cyan-500 to-eco-ocean",
  },
  {
    icon: Wind,
    title: "Zero Waste Journey",
    description: "Small actions today create a cleaner tomorrow. Start your eco journey!",
    color: "from-emerald-400 to-teal-500",
  },
];

export const EcoCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ecoFacts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Parallax Background */}
      <motion.div
        animate={{
          backgroundPosition: [`0% ${currentIndex * 25}%`, `100% ${(currentIndex + 1) * 25}%`],
        }}
        transition={{ duration: 5, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-br from-eco-mint via-eco-mint-accent to-secondary opacity-50"
      />
      
      {/* Floating decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-4 top-4 h-16 w-16 rounded-full bg-primary/10"
        />
        <motion.div
          animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-2 bottom-8 h-12 w-12 rounded-full bg-eco-leaf/10"
        />
      </div>

      <div className="relative min-h-[200px] p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center"
          >
            <div className={`mb-4 rounded-2xl bg-gradient-to-br ${ecoFacts[currentIndex].color} p-4 shadow-lg`}>
              {(() => {
                const Icon = ecoFacts[currentIndex].icon;
                return <Icon className="h-8 w-8 text-white" />;
              })()}
            </div>
            <h3 className="mb-2 text-lg font-bold text-foreground">
              {ecoFacts[currentIndex].title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {ecoFacts[currentIndex].description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Dots indicator */}
        <div className="mt-6 flex justify-center gap-2">
          {ecoFacts.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-6 bg-primary"
                  : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
