import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopHeader } from "./TopHeader";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <TopHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-border bg-card/80 backdrop-blur-sm py-4 px-4 md:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            © {currentYear} جميع حقوق الملكية والفكرية محفوظة وفقاً لمذكرة التفاهم الموقعة بين جامعة فلسطين التقنية - خضوري وبلدية طولكرم
          </p>
        </div>
      </footer>
    </div>
  );
}
