const Logo = "/Logo.jpeg";
import { Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface TopHeaderProps {
  onToggleSidebar: () => void;
}

export function TopHeader({ onToggleSidebar }: TopHeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-lg sticky top-0 z-50 shadow-gov-soft">
      <div className="h-full flex items-center justify-between px-4 md:px-8">

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={onToggleSidebar}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-all duration-200"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-primary" />
          </button>
          <div className="hidden sm:block">
            <h2 className="text-sm md:text-base font-bold text-primary-dark">
              بلدية طولكرم
            </h2>
            <p className="text-[11px] text-muted-foreground">المكتبة العامة</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-left hidden sm:block">
            <h2 className="text-sm md:text-base font-bold text-primary-dark tracking-wide">
              Tulkarm Municipality
            </h2>
            <p className="text-[11px] text-muted-foreground">Public Library</p>
          </div>
          <img
            src={Logo}
            alt="شعار مكتبة بلدية طولكرم"
            className="w-12 h-12 rounded-xl border border-border shadow-gov-soft object-contain bg-card"
          />
        </div>

      </div>
    </header>
  );
}
