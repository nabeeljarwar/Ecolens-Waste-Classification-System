import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Home as HomeIcon, FileText, Info, Navigation, Loader2 } from "lucide-react";
import { WasteAnimation } from "@/components/WasteAnimation";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ClassificationResult, getWasteInfo } from "@/services/classificationService";
import { useGeolocation, calculateDistance } from "@/hooks/useGeolocation";
import { muetBinLocations } from "@/data/muetLocations";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ScanResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { latitude, longitude, error: geoError, loading: geoLoading } = useGeolocation();
  const classification = location.state?.classification as ClassificationResult | undefined;
  const [saving, setSaving] = useState(false);

  // Fallback if navigated directly
  const info = classification || getWasteInfo("recyclable");
  const confidence = classification?.confidence || 0.85;

  const nearbyBins = useMemo(() => {
    return muetBinLocations
      .map((loc) => {
        const type = loc.binTypes === "dynamic" ? info.binLabel : loc.binTypes;
        let distance: string;
        if (latitude !== null && longitude !== null) {
          const dist = calculateDistance(latitude, longitude, loc.latitude, loc.longitude);
          distance = dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
        } else {
          distance = "—";
        }
        return { name: loc.name, distance, type, rawDist: latitude !== null && longitude !== null ? calculateDistance(latitude, longitude, loc.latitude, loc.longitude) : Infinity };
      })
      .sort((a, b) => a.rawDist - b.rawDist);
  }, [latitude, longitude, info.binLabel]);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="relative overflow-hidden px-4 pb-6 pt-12">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/scan")}
          className="flex items-center gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">Back to Scan</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4"
        >
          <h1 className="text-2xl font-bold text-foreground">Scan Result</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI Classification Complete • {Math.round(confidence * 100)}% confidence
          </p>
        </motion.div>
      </header>

      <main className="px-4">
        {/* Animation Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card overflow-hidden rounded-2xl"
        >
          <WasteAnimation category={info.category} />
          
          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground capitalize">{info.category.replace("-", "-")}</h2>
                <p className="text-sm text-muted-foreground">
                  Dispose in <span style={{ color: info.color }} className="font-semibold">{info.binColor}</span>
                </p>
              </div>
              <div
                className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: info.color }}
              >
                {info.binLabel}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Disposal Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <h3 className="mb-3 text-lg font-semibold text-foreground">Disposal Tips</h3>
          <div className="glass-card rounded-2xl p-4">
            <ul className="space-y-3">
              {info.tips.map((tip, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div
                    className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: info.color }}
                  >
                    {index + 1}
                  </div>
                  <span className="text-sm text-foreground">{tip}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <h3 className="mb-3 text-lg font-semibold text-foreground">More Information</h3>
          <Accordion type="single" collapsible className="space-y-3">
            {/* Nearby Bins */}
            <AccordionItem value="nearby-bins" className="glass-card overflow-hidden rounded-2xl border-0">
              <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-eco-ocean/10">
                    <MapPin className="h-5 w-5 text-eco-ocean" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Nearby Bins</p>
                    <p className="text-xs text-muted-foreground">{nearbyBins.length} locations found</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {geoLoading && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Getting your location...
                  </div>
                )}
                {geoError && (
                  <div className="mb-3 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                    📍 Location access denied. Distances unavailable. Please enable location in browser settings.
                  </div>
                )}
                <div className="space-y-3">
                  {nearbyBins.map((bin, index) => (
                    <div key={index} className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{bin.name}</p>
                        <p className="text-xs text-muted-foreground">Accepts: {bin.type}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {bin.distance !== "—" && <Navigation className="h-3 w-3 text-primary" />}
                        <span className="text-sm font-semibold text-primary">{bin.distance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Home Disposal Tips */}
            <AccordionItem value="home-tips" className="glass-card overflow-hidden rounded-2xl border-0">
              <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-eco-leaf/10">
                    <HomeIcon className="h-5 w-5 text-eco-leaf" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Home Disposal Tips</p>
                    <p className="text-xs text-muted-foreground">DIY & reuse methods</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {info.homeTips.map((tip, index) => (
                    <p key={index} className="text-sm text-foreground">
                      {tip.icon} <strong>{tip.title}:</strong> {tip.description}
                    </p>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Government Guidelines */}
            <AccordionItem value="govt-guidelines" className="glass-card overflow-hidden rounded-2xl border-0">
              <AccordionTrigger className="px-4 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-eco-earth/10">
                    <FileText className="h-5 w-5 text-eco-earth" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Govt. Guidelines</p>
                    <p className="text-xs text-muted-foreground">Official disposal rules</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {info.govtGuidelines.map((item, index) => (
                    <p key={index} className="text-sm text-foreground">
                      {item.icon} <strong>{item.title}:</strong> {item.description}
                    </p>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 space-y-3"
        >
          <Button
            onClick={async () => {
              if (!user) {
                toast.error("Please log in first");
                return;
              }
              setSaving(true);
              const { error } = await supabase.from("scan_history").insert({
                user_id: user.id,
                category: info.category,
                bin_color: info.binColor,
                disposed: false,
                points_earned: 10,
              });
              setSaving(false);
              if (error) {
                toast.error("Failed to save scan");
                console.error(error);
              } else {
                toast.success("Added to pending disposals!");
                navigate("/disposal");
              }
            }}
            disabled={saving}
            className="w-full gap-2 rounded-2xl bg-primary py-6 text-primary-foreground hover:bg-primary/90"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Add to Pending Disposals"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/scan")}
            className="w-full gap-2 rounded-2xl py-6"
          >
            Scan Another Item
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default ScanResult;
