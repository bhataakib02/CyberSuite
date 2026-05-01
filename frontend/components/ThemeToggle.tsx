"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[104px] h-[36px] bg-black/40 border border-white/5 rounded-xl" />;
  }

  return (
    <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-xl backdrop-blur-md">
      <button
        onClick={() => setTheme("light")}
        className={`relative p-1.5 rounded-lg text-xs font-bold transition-all z-10 ${
          theme === "light" ? "text-primary" : "text-zinc-500 hover:text-zinc-300"
        }`}
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
        {theme === "light" && (
          <motion.div
            layoutId="theme-active"
            className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-lg -z-10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </button>

      <button
        onClick={() => setTheme("dark")}
        className={`relative p-1.5 rounded-lg text-xs font-bold transition-all z-10 ${
          theme === "dark" ? "text-primary" : "text-zinc-500 hover:text-zinc-300"
        }`}
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
        {theme === "dark" && (
          <motion.div
            layoutId="theme-active"
            className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-lg -z-10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </button>

      <button
        onClick={() => setTheme("system")}
        className={`relative p-1.5 rounded-lg text-xs font-bold transition-all z-10 ${
          theme === "system" ? "text-primary" : "text-zinc-500 hover:text-zinc-300"
        }`}
        title="System Preference"
      >
        <Monitor className="w-4 h-4" />
        {theme === "system" && (
          <motion.div
            layoutId="theme-active"
            className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-lg -z-10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </button>
    </div>
  );
}
