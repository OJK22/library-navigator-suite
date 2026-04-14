import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5001,
    hmr: {
      overlay: false,
    },
    proxy: {
      // 1. توجيه طلبات الـ CMS
      "/api/Cms": {
        target: "http://librarytest.runasp.net",
        changeOrigin: true,
        secure: false,
      },
      // 2. توجيه الميديا مع حذف كلمة media من الرابط
      "/media": {
        target: "http://librarytest.runasp.net",
        changeOrigin: true,
        secure: false,
        // هذا السطر هو "المفتاح": يحول /media/uploads إلى /uploads ليطابق السيرفر
        rewrite: (path) => path.replace(/^\/media/, ''),
      },
      // 3. توجيه الـ API العامة
      "/api": {
        target: "http://mylibrary.tryasp.net",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));