import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, SwitchCamera, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { classifyWaste } from "@/services/classificationService";
import { toast } from "sonner";

interface MockCameraProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MockCamera = ({ isOpen, onClose }: MockCameraProps) => {
  const navigate = useNavigate();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError("Camera access denied. Please allow camera permissions.");
    }
  }, [facingMode]);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, startCamera, capturedImage]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(base64);

    // Stop camera after capturing
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    // Camera will restart via useEffect
  };

  const handleClassify = async () => {
    if (!capturedImage) return;
    setIsClassifying(true);

    try {
      const result = await classifyWaste(capturedImage);
      navigate("/scan/result", { state: { classification: result } });
    } catch (e) {
      console.error("Classification error:", e);
      toast.error(e instanceof Error ? e.message : "Classification failed. Please try again.");
      setIsClassifying(false);
    }
  };

  const handleClose = () => {
    setCapturedImage(null);
    setIsClassifying(false);
    onClose();
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black"
        >
          <div className="relative h-full w-full flex flex-col">
            {/* Camera feed or captured image */}
            <div className="flex-1 relative">
              {!capturedImage ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <img
                  src={capturedImage}
                  alt="Captured waste"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <canvas ref={canvasRef} className="hidden" />

              {cameraError && !capturedImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                  <p className="mt-4 text-sm text-white">{cameraError}</p>
                  <Button onClick={startCamera} className="mt-4 rounded-full" variant="outline">
                    Retry
                  </Button>
                </div>
              )}
            </div>

            {/* Top controls */}
            <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4 pt-12">
              <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full bg-white/10 text-white hover:bg-white/20">
                <X className="h-6 w-6" />
              </Button>
              {!capturedImage && (
                <Button variant="ghost" size="icon" onClick={toggleCamera} className="rounded-full bg-white/10 text-white hover:bg-white/20">
                  <SwitchCamera className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pb-12 pt-8">
              {!capturedImage ? (
                <div className="flex flex-col items-center">
                  <p className="mb-4 text-sm font-medium text-white/80">Tap to capture waste item</p>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCapture}
                    disabled={!!cameraError}
                    className="relative flex h-20 w-20 items-center justify-center"
                  >
                    <div className="absolute inset-0 rounded-full border-4 border-white/50" />
                    <div className="h-16 w-16 rounded-full bg-white shadow-lg" />
                  </motion.button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 px-6">
                  <Button
                    onClick={handleClassify}
                    disabled={isClassifying}
                    className="w-full gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-base py-6"
                  >
                    {isClassifying ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Classifying...
                      </>
                    ) : (
                      <>
                        <Camera className="h-5 w-5" />
                        Classify This Waste
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleRetake}
                    disabled={isClassifying}
                    variant="ghost"
                    className="w-full rounded-full text-white hover:bg-white/10"
                  >
                    Retake Photo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
