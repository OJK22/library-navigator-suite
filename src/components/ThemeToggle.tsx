import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDark(true);
    } else if (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setDark(true);
    }
  }, []);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="relative p-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-all duration-300 group"
      aria-label="تبديل الوضع"
    >
      <Sun className={`w-[18px] h-[18px] text-amber-500 transition-all duration-300 ${dark ? "scale-0 rotate-90 opacity-0 absolute" : "scale-100 rotate-0 opacity-100"}`} />
      <Moon className={`w-[18px] h-[18px] text-primary-light transition-all duration-300 ${dark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0 absolute"}`} />
    </button>
  );
}
