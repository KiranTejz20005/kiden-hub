import { Suspense, lazy } from "react";
import { Toaster } from "react-hot-toast";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

import { VisibilityManager } from "@/components/providers/VisibilityManager";
import { CacheProvider } from "@/components/providers/CacheProvider";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));
const GoogleCallback = lazy(() => import("./pages/auth/GoogleCallback"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Terms = lazy(() => import("./pages/legal/Terms"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Layer 2: 5 minutes global staleTime
      retry: 1,
      refetchOnWindowFocus: false, // Layer 2: Disable refetch on tab return
      refetchOnReconnect: false,   // Layer 2: Disable refetch on reconnect
      gcTime: 10 * 60 * 1000,      // Keep in cache for 10 minutes
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
    <div className="w-6 h-6 border-[1.5px] border-white/10 border-t-white rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <VisibilityManager>
        <CacheProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster position="bottom-right" />
              <Sonner />
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/sign-in" element={<Auth />} />
                    <Route path="/sign-up" element={<Auth />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/callback/google" element={<GoogleCallback />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route
                      path="/dashboard/*"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/onboarding"
                      element={
                        <ProtectedRoute>
                          <Onboarding />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </CacheProvider>
      </VisibilityManager>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;