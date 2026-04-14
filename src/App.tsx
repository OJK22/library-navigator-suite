import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AddBook from "./pages/AddBook";
import Books from "./pages/Books";
import Barcode from "./pages/BarcodeBooks";
import Reports from "./pages/Reports";
import Delete from "./pages/DeleteBooks";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");

  // In Lovable preview, allow access without token for testing
  const isPreview = window.location.hostname.includes("lovable.app") || 
                    window.location.hostname === "localhost";
  
  if (!token && !isPreview) {
    return <Navigate to="/login" replace />;
  }

  // If no token in preview, still set a mock token so API calls don't fail silently
  if (!token && isPreview) {
    // Allow navigation but don't set fake tokens
  }

  return <Outlet />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/add-book" element={<AddBook />} />
                <Route path="/update-books" element={<Books />} />
                <Route path="/barcode" element={<Barcode />} />
                <Route path="/delete" element={<Delete />} />
                <Route path="/reports" element={<Reports />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>

      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
