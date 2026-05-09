import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Index from './pages/Index.tsx';
import NotFound from './pages/NotFound.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import PassengerDashboard from './pages/PassengerDashboard.tsx';
import DriverDashboard from './pages/DriverDashboard.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { useAppStore } from './store/useAppStore';
import { useEffect } from 'react';

const queryClient = new QueryClient();

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useAppStore();
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeWrapper>
        <Toaster />
        <Sonner theme="dark" position="top-center" richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/user" element={<ProtectedRoute role="passenger"><PassengerDashboard /></ProtectedRoute>} />
            <Route path="/driver" element={<ProtectedRoute role="driver"><DriverDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ThemeWrapper>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
