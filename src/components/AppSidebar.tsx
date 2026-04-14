import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookPlus, BookOpen, BarChart3, BookX, QrCode, Home, LogOut, X, Library, ChevronLeft,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { title: "الرئيسية", path: "/", icon: Home },
  { title: "إضافة كتاب", path: "/add-book", icon: BookPlus },
  { title: "عرض الكتب", path: "/update-books", icon: BookOpen },
  { title: "التقارير", path: "/reports", icon: BarChart3 },
  { title: "إخراج كتاب", path: "/delete", icon: BookX },
  { title: "باركود", path: "/barcode", icon: QrCode },
];

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("token");
    setShowLogoutConfirm(false);
    onClose();
    navigate("/login");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-foreground/25 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Sidebar panel */}
          <motion.aside
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed top-0 right-0 z-50 h-full w-[290px] flex flex-col overflow-hidden sidebar-glass"
            dir="rtl"
          >
            {/* Header */}
            <div className="px-5 pt-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl sidebar-icon-bg flex items-center justify-center shadow-lg">
                    <Library className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">مكتبة البلدية</h3>
                    <p className="text-[10px] text-muted-foreground font-medium">لوحة التحكم</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-muted/60 hover:bg-muted transition-all duration-200 group"
                >
                  <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>

              {/* Separator */}
              <div className="h-px bg-gradient-to-l from-transparent via-border to-transparent" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-2 px-4 space-y-1 overflow-y-auto">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.3 }}
                    onClick={() => handleNav(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all duration-250 group relative overflow-hidden ${
                      isActive
                        ? "sidebar-nav-active text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 sidebar-nav-active-bg rounded-2xl"
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      />
                    )}
                    <div className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                    }`}>
                      <item.icon className="w-[16px] h-[16px]" />
                    </div>
                    <span className="relative z-10">{item.title}</span>
                    {isActive && (
                      <ChevronLeft className="w-4 h-4 mr-auto relative z-10 text-primary" />
                    )}
                  </motion.button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4">
              <div className="h-px bg-gradient-to-l from-transparent via-border to-transparent mb-4" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-semibold text-destructive/80 hover:text-destructive hover:bg-destructive/8 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/15 transition-colors">
                  <LogOut className="w-4 h-4" />
                </div>
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </motion.aside>

          {/* Logout Confirmation Dialog */}
          <AnimatePresence>
            {showLogoutConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
                onClick={() => setShowLogoutConfirm(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center"
                  onClick={(e) => e.stopPropagation()}
                  dir="rtl"
                >
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-destructive/10 flex items-center justify-center">
                    <LogOut className="w-7 h-7 text-destructive" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">تسجيل الخروج</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    هل أنت متأكد من رغبتك في تسجيل الخروج من النظام؟
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={confirmLogout}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium text-sm hover:bg-destructive/90 transition-colors shadow-md"
                    >
                      تأكيد الخروج
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
