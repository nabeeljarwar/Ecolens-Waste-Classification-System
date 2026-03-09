import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Scan from "./pages/Scan";
import ScanResult from "./pages/ScanResult";
import Challenges from "./pages/Challenges";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import DisposalConfirmation from "./pages/DisposalConfirmation";
import ScanHistory from "./pages/ScanHistory";
import Rewards from "./pages/Rewards";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/scan" element={<ProtectedRoute><Scan /></ProtectedRoute>} />
            <Route path="/scan/result" element={<ProtectedRoute><ScanResult /></ProtectedRoute>} />
            <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/disposal" element={<ProtectedRoute><DisposalConfirmation /></ProtectedRoute>} />
            <Route path="/scan-history" element={<ProtectedRoute><ScanHistory /></ProtectedRoute>} />
            <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
