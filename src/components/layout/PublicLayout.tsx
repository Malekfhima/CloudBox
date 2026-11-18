import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { BrandLogo } from '@/src/components/common/BrandLogo';
import { Button } from '@/src/components/ui/button';
import { useAuthStore } from '@/src/store/authStore';

const NAV_LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="whitespace-nowrap shrink-0">
            <BrandLogo />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `whitespace-nowrap shrink-0 transition-colors hover:text-slate-950 ${
                    isActive ? 'text-blue-600 font-semibold' : ''
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to={isAuthenticated ? '/dashboard' : '/login'}>
                {isAuthenticated ? 'Open Workspace' : 'Sign in'}
              </Link>
            </Button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
            <nav className="flex flex-col space-y-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="pt-3">
                <Button asChild className="w-full">
                  <Link
                    to={isAuthenticated ? '/dashboard' : '/login'}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {isAuthenticated ? 'Open Workspace' : 'Sign in'}
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-3">
              <BrandLogo />
              <p className="text-sm leading-relaxed text-slate-500">
                Encrypted cloud storage, granular permission governance, and instant team sync for
                modern product organizations.
              </p>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-900">
                Platform
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <Link to="/features" className="hover:text-blue-600">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-blue-600">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-blue-600">
                    Workspace Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-blue-600">
                    Create Account
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-900">
                Company
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <Link to="/about" className="hover:text-blue-600">
                    About CloudBox
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-blue-600">
                    Contact Sales
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-900">
                Compliance
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>SOC 2 Type II Certified</li>
                <li>ISO 27001 Infrastructure</li>
                <li>GDPR &amp; HIPAA Ready</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row">
            <p>&copy; {new Date().getFullYear()} CloudBox Technologies Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/contact" className="hover:text-slate-800">
                Security
              </Link>
              <Link to="/contact" className="hover:text-slate-800">
                Privacy
              </Link>
              <Link to="/contact" className="hover:text-slate-800">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
