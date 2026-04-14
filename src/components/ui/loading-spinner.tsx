import { motion, AnimatePresence } from "framer-motion";
import { BookOpen } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
}

export function LoadingSpinner({ text = "جاري التحميل...", size = "md", fullPage = false }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: { icon: 16, container: "w-8 h-8", text: "text-xs" },
    md: { icon: 20, container: "w-12 h-12", text: "text-sm" },
    lg: { icon: 28, container: "w-16 h-16", text: "text-base" },
  };

  const s = sizeMap[size];

  const content = (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className={`${s.container} rounded-2xl border-2 border-primary/20 border-t-primary flex items-center justify-center`}
        >
          <BookOpen className="text-primary" size={s.icon} />
        </motion.div>
      </div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${s.text} text-muted-foreground font-medium`}
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

export function InlineLoader({ text = "جاري التحميل..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        className="h-4 w-4 rounded-full border-2 border-primary/20 border-t-primary"
      />
      <span>{text}</span>
    </div>
  );
}

/** Premium full-screen loading overlay */
export function FullScreenLoader({ visible, text = "جاري المعالجة..." }: { visible: boolean; text?: string }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/30 backdrop-blur-md"
          style={{ pointerEvents: "all" }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-card border border-border rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-5 min-w-[260px]"
          >
            {/* Animated rings */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary border-r-primary/40"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 rounded-full border-[2px] border-transparent border-b-secondary border-l-secondary/40"
              />
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <BookOpen className="w-7 h-7 text-primary" />
              </motion.div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-foreground">{text}</p>
              <motion.div className="flex justify-center gap-1 pt-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
