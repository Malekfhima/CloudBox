import {
  Activity,
  BarChart3,
  Bell,
  Clock,
  CreditCard,
  FolderOpen,
  HardDrive,
  Home,
  Lock,
  Send,
  Settings,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { BrandLogo } from '@/src/components/common/BrandLogo';
import { StorageUsageCard } from '@/src/components/files/StorageUsageCard';
import { Button } from '@/src/components/ui/button';
import { useNotifications } from '@/src/hooks/useDashboard';
import { cn } from '@/src/lib/utils';
import { useAuthStore } from '@/src/store/authStore';
import { useUiStore } from '@/src/store/uiStore';

const WORKSPACE_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: Home, end: true },
  { to: '/dashboard/files', label: 'My Files', icon: FolderOpen },
  { to: '/dashboard/recent', label: 'Recent Files', icon: Clock },
  { to: '/dashboard/shared-with-me', label: 'Shared With Me', icon: Users },
  { to: '/dashboard/shared-by-me', label: 'Shared By Me', icon: Send },
  { to: '/dashboard/favorites', label: 'Favorites', icon: Star },
  { to: '/dashboard/trash', label: 'Trash', icon: Trash2 },
];

const ACCOUNT_ITEMS = [
  { to: '/dashboard/storage', label: 'Storage Usage', icon: HardDrive },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell, showUnread: true },
  { to: '/dashboard/settings/profile', label: 'Profile Settings', icon: Settings },
  { to: '/dashboard/settings/security', label: 'Security Settings', icon: Lock },
];

const ADMIN_ITEMS = [
  { to: '/admin', label: 'Admin Overview', icon: ShieldCheck, end: true },
  { to: '/admin/users', label: 'User Management', icon: Users },
  { to: '/admin/storage', label: 'Storage Management', icon: HardDrive },
  { to: '/admin/logs', label: 'Activity Logs', icon: Activity },
  { to: '/admin/stats', label: 'System Statistics', icon: BarChart3 },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const { mobileSidebarOpen, setMobileSidebarOpen, openUploadModal } = useUiStore();
  const { data: notifData } = useNotifications();
  const unreadCount = notifData?.unreadCount ?? 0;

  const closeMobile = () => setMobileSidebarOpen(false);

  const navContent = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
        <Link to="/dashboard" onClick={closeMobile}>
          <BrandLogo />
        </Link>
        <button
          type="button"
          onClick={closeMobile}
          aria-label="Close navigation"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4">
        <Button
          type="button"
          className="w-full justify-center"
          onClick={() => {
            closeMobile();
            openUploadModal(null);
          }}
        >
          <Upload className="h-4 w-4" />
          Upload files
        </Button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        <div>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>
          <nav className="space-y-0.5">
            {WORKSPACE_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeMobile}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Account
          </p>
          <nav className="space-y-0.5">
            {ACCOUNT_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobile}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.showUnread && unreadCount > 0 ? (
                  <span className="font-mono text-xs font-semibold text-blue-600 tabular-nums">
                    {unreadCount}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>
        </div>

        {user?.role === 'admin' ? (
          <div>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Admin Console
            </p>
            <nav className="space-y-0.5">
              {ADMIN_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        ) : null}
      </div>

      {user ? (
        <div className="border-t border-slate-200 p-4">
          <StorageUsageCard
            compact
            usedBytes={user.storageUsedBytes}
            quotaBytes={user.storageQuotaBytes}
            plan={user.plan}
          />
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px]"
            onClick={closeMobile}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-slate-200 bg-white shadow-xl">
            {navContent}
          </aside>
        </div>
      ) : null}
    </>
  );
}
