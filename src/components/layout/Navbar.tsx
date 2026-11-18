import { Bell, LogOut, Menu, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '@/src/api/auth.api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { useNotifications } from '@/src/hooks/useDashboard';
import { useAuthStore } from '@/src/store/authStore';
import { useUiStore } from '@/src/store/uiStore';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Workspace Overview',
  '/dashboard/files': 'My Files',
  '/dashboard/recent': 'Recent Files',
  '/dashboard/shared-with-me': 'Shared With Me',
  '/dashboard/shared-by-me': 'Shared By Me',
  '/dashboard/favorites': 'Favorites',
  '/dashboard/trash': 'Trash',
  '/dashboard/storage': 'Storage Usage',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/settings/profile': 'Profile Settings',
  '/dashboard/settings/security': 'Security Settings',
  '/admin': 'Admin Overview',
  '/admin/users': 'User Management',
  '/admin/storage': 'Storage Management',
  '/admin/logs': 'Activity Logs',
  '/admin/stats': 'System Statistics',
  '/admin/subscriptions': 'Subscription Management',
};

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshToken, clearSession } = useAuthStore();
  const { setMobileSidebarOpen } = useUiStore();
  const { data: notifData } = useNotifications();
  const unreadCount = notifData?.unreadCount ?? 0;

  const pageTitle = ROUTE_TITLES[location.pathname] || 'CloudBox Workspace';

  const handleSignOut = async () => {
    try {
      await authApi.logout(refreshToken);
    } catch {
      // Clear local session regardless
    }
    clearSession();
    toast.success('Signed out of CloudBox.');
    navigate('/login');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'CB';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open navigation menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{pageTitle}</p>
          <p className="hidden truncate text-xs text-slate-500 sm:block">
            {user?.company || 'CloudBox Workspace'} · {user?.plan || 'Starter'} Plan
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <Link
          to="/dashboard/notifications"
          aria-label="Notifications"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1 font-mono text-[10px] font-semibold text-white">
              {unreadCount}
            </span>
          ) : null}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  {initials}
                </div>
              )}
              <div className="hidden sm:block max-w-[140px]">
                <p className="truncate text-xs font-semibold text-slate-900">{user?.name}</p>
                <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs font-normal text-slate-500">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings/profile')}>
              <UserIcon className="h-4 w-4" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings/security')}>
              <ShieldCheck className="h-4 w-4" />
              Security Settings
            </DropdownMenuItem>
            {user?.role === 'admin' ? (
              <DropdownMenuItem onClick={() => navigate('/admin')}>
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Admin Console
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
