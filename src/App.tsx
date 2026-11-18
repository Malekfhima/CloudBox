import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { PublicLayout } from '@/src/components/layout/PublicLayout';
import { ActivityLogsPage } from '@/src/pages/admin/ActivityLogsPage';
import { AdminOverviewPage } from '@/src/pages/admin/AdminOverviewPage';
import { StorageManagementPage } from '@/src/pages/admin/StorageManagementPage';
import { SubscriptionManagementPage } from '@/src/pages/admin/SubscriptionManagementPage';
import { SystemStatsPage } from '@/src/pages/admin/SystemStatsPage';
import { UserManagementPage } from '@/src/pages/admin/UserManagementPage';
import { ForgotPasswordPage } from '@/src/pages/auth/ForgotPasswordPage';
import { LoginPage } from '@/src/pages/auth/LoginPage';
import { RegisterPage } from '@/src/pages/auth/RegisterPage';
import { ResetPasswordPage } from '@/src/pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/src/pages/auth/VerifyEmailPage';
import { FavoritesPage } from '@/src/pages/dashboard/FavoritesPage';
import { MyFilesPage } from '@/src/pages/dashboard/MyFilesPage';
import { NotificationsPage } from '@/src/pages/dashboard/NotificationsPage';
import { OverviewPage } from '@/src/pages/dashboard/OverviewPage';
import { ProfileSettingsPage } from '@/src/pages/dashboard/ProfileSettingsPage';
import { RecentFilesPage } from '@/src/pages/dashboard/RecentFilesPage';
import { SecuritySettingsPage } from '@/src/pages/dashboard/SecuritySettingsPage';
import { SharedByMePage } from '@/src/pages/dashboard/SharedByMePage';
import { SharedWithMePage } from '@/src/pages/dashboard/SharedWithMePage';
import { StorageUsagePage } from '@/src/pages/dashboard/StorageUsagePage';
import { TrashPage } from '@/src/pages/dashboard/TrashPage';
import { AboutPage } from '@/src/pages/public/AboutPage';
import { ContactPage } from '@/src/pages/public/ContactPage';
import { FeaturesPage } from '@/src/pages/public/FeaturesPage';
import { LandingPage } from '@/src/pages/public/LandingPage';
import { PricingPage } from '@/src/pages/public/PricingPage';
import { useAuthStore } from '@/src/store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Marketing Pages */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          {/* Authentication Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* User Dashboard Pages */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="files" element={<MyFilesPage />} />
            <Route path="recent" element={<RecentFilesPage />} />
            <Route path="shared-with-me" element={<SharedWithMePage />} />
            <Route path="shared-by-me" element={<SharedByMePage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="trash" element={<TrashPage />} />
            <Route path="storage" element={<StorageUsagePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings/profile" element={<ProfileSettingsPage />} />
            <Route path="settings/security" element={<SecuritySettingsPage />} />
          </Route>

          {/* Admin Console Pages */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <DashboardLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminOverviewPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="storage" element={<StorageManagementPage />} />
            <Route path="logs" element={<ActivityLogsPage />} />
            <Route path="stats" element={<SystemStatsPage />} />
            <Route path="subscriptions" element={<SubscriptionManagementPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
