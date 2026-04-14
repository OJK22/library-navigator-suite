import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, User, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

function InlineToast({ type, message, show }: { type: "success" | "error"; message: string; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${
            type === "success"
              ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
              : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
          }`}
        >
          {type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const navigate = useNavigate();

  const validate = () => {
    const errs: typeof errors = {};
    if (!username.trim()) errs.username = "اسم المستخدم مطلوب";
    if (!password.trim()) errs.password = "كلمة المرور مطلوبة";
    else if (password.length < 3) errs.password = "كلمة المرور قصيرة جداً";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const showToast = (type: "success" | "error", message: string, duration = 3000) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), duration);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const response = await fetch("/api/Auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        showToast("error", data?.message || "تحقق من بيانات الدخول");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("loginTime", Date.now().toString());
      navigate("/", { replace: true });
    } catch {
      showToast("error", "فشل الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="absolute top-6 left-6 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md mx-4">
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl p-8 md:p-10 space-y-6">
          
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg">
              <img src="/Logo.jpeg" alt="شعار المكتبة" className="w-14 h-14 rounded-xl object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">مكتبة بلدية طولكرم</h1>
              <p className="text-sm text-muted-foreground mt-1">نظام إدارة المكتبة العامة</p>
            </div>
          </div>

          {toast && <InlineToast type={toast.type} message={toast.message} show={!!toast} />}

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-l from-border to-transparent" />
            <span className="text-xs text-muted-foreground font-medium">تسجيل الدخول</span>
            <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground block required-label">اسم المستخدم</label>
              <div className="relative">
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <input
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setErrors(p => ({ ...p, username: undefined })); }}
                  className={`w-full bg-muted/40 border rounded-xl pr-14 pl-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 ${errors.username ? "border-destructive" : "border-border"}`}
                />
              </div>
              {errors.username && <p className="text-xs text-destructive font-medium">{errors.username}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground block required-label">كلمة المرور</label>
              <div className="relative">
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                  className={`w-full bg-muted/40 border rounded-xl pr-14 pl-12 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 ${errors.password ? "border-destructive" : "border-border"}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-muted transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive font-medium">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-sm gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  جاري الدخول...
                </span>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground">
            بلدية طولكرم — المكتبة العامة © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
