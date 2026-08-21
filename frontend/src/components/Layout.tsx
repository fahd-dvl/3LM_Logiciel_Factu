// components/Layout.tsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, Moon, Sun } from "lucide-react";
import { Sidebar } from "./ui/SideBar";
import { Button } from "./ui/button";
import { useTheme } from "../contexts/ThemeContext";

export function Layout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-gray-900">
      <div className="flex">
        <Sidebar />
        <Sidebar
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />

        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 bg-white/70 dark:bg-gray-800 backdrop-blur border-b border-black/5 dark:border-gray-700 sticky top-0 z-30">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1" />

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8"
              title={
                theme === "light"
                  ? "Activer le mode sombre"
                  : "Activer le mode clair"
              }
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
          </div>

          <main className="flex-1 p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
