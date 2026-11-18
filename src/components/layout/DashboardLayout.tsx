import { Outlet } from 'react-router-dom';
import { UploadModal } from '@/src/components/files/UploadModal';
import { UploadProgress } from '@/src/components/files/UploadProgress';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <UploadModal />
      <UploadProgress />
    </div>
  );
}
