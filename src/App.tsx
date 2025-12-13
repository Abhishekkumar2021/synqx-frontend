import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

// Components
import { Layout } from './components/Layout';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider } from './components/AuthProvider';

// Hooks
import { useAuth } from './hooks/useAuth';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { ConnectionDetailsPage } from './pages/ConnectionDetailsPage';
import { PipelinesListPage } from './pages/pipelines/PipelinesListPage';
import { PipelineEditorPage } from './pages/pipelines/PipelineEditorPage';
import { JobsPage } from './pages/JobsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * 1. Full Page Loader
 * A premium loading screen while Auth checks session.
 */
const FullPageLoader = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground animate-in fade-in duration-500">
    <div className="relative flex items-center justify-center">
      <div className="absolute inset-0 rounded-full blur-xl bg-primary/30 animate-pulse" />
      <div className="p-4 bg-background/50 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl relative">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    </div>
    <h2 className="mt-6 text-lg font-semibold tracking-tight animate-pulse text-muted-foreground">
      Initializing SynqX...
    </h2>
  </div>
);

/**
 * 2. Protected Route Guard
 * Redirects to /login if not authenticated.
 */
const ProtectedRoute = () => {
  const { token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  
  if (!token) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wrap the Outlet (page content) in the Main Layout
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

/**
 * 3. Public Route Guard
 * Redirects to /dashboard if ALREADY authenticated (e.g. user goes to /login while logged in).
 */
const PublicRoute = () => {
    const { token, isLoading } = useAuth();

    if (isLoading) return <FullPageLoader />;

    if (token) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* --- Public Routes (Guarded against logged-in users) --- */}
            <Route element={<PublicRoute />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* --- Protected Routes (Wrapped in Layout) --- */}
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                
                {/* Connections */}
                <Route path="/connections" element={<ConnectionsPage />} />
                <Route path="/connections/:id" element={<ConnectionDetailsPage />} />
                
                {/* Pipelines */}
                <Route path="/pipelines" element={<PipelinesListPage />} />
                <Route path="/pipelines/:id" element={<PipelineEditorPage />} />
                
                {/* Jobs / Logs */}
                <Route path="/jobs" element={<JobsPage />} />
                
                {/* Settings */}
                <Route path="/settings" element={<SettingsPage />} />

                {/* Catch-all for protected area */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
        </Routes>
    );
};

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="synqx-theme">
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrowserRouter>
                    <AppRoutes />
                    {/* Global Toaster for Notifications */}
                    <Toaster richColors position="top-right" />
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;