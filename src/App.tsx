import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { PipelinesListPage } from './pages/pipelines/PipelinesListPage';
import { PipelineEditorPage } from './pages/pipelines/PipelineEditorPage';
import { JobsPage } from './pages/JobsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { ThemeProvider } from './components/ThemeProvider';

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="synqx-theme">
        <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <Layout>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/connections" element={<ConnectionsPage />} />
                <Route path="/pipelines" element={<PipelinesListPage />} />
                <Route path="/pipelines/:id" element={<PipelineEditorPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Layout>
        </BrowserRouter>
        </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;