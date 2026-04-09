import { LayoutDashboard, CheckSquare, FileText, Users, Sprout, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: CheckSquare, label: "Disposals", path: "/admin/disposals" },
  { icon: FileText, label: "Reports", path: "/admin/reports" },
  { icon: Sprout, label: "Plants", path: "/admin/challenges" },
  { icon: Users, label: "Users", path: "/admin/users" },
];

export const AdminNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <div className="glass-card mx-auto max-w-md rounded-2xl px-1 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="relative flex flex-col items-center gap-1 px-2 py-2">
                {isActive && (
                  <motion.div layoutId="adminTab" className="absolute inset-0 rounded-xl bg-primary/10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>{item.label}</span>
              </Link>
            );
          })}
          <button onClick={handleLogout} className="flex flex-col items-center gap-1 px-2 py-2 text-muted-foreground">
            <LogOut className="h-4 w-4" />
            <span className="text-[10px]">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
