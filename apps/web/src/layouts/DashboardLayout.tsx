import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  HardDrive,
  User,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/services/auth';

const sidebarLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/events', icon: Calendar, label: 'Events' },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
  { to: '/debug', icon: HardDrive, label: 'Debug' },
];

const mobileNavLinks = sidebarLinks.slice(0, 5);

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, business } = useAuthStore();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    document.body.classList.add('dashboard-mobile-chrome');
    return () => document.body.classList.remove('dashboard-mobile-chrome');
  }, []);

  return (
    <div className="min-h-dvh bg-background overflow-x-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r bg-background">
        <div className="flex h-16 items-center border-b px-4">
          <BrandLogo linkToHome size="sm" />
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4 hidden lg:block">
          <div className="mb-3 px-3">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{business?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent min-h-[44px]"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-40 border-b bg-background safe-top safe-x">
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4">
          <BrandLogo linkToHome size="sm" className="min-w-0 max-w-[52%]" />
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r bg-background lg:hidden safe-top"
            >
              <div className="flex h-14 items-center justify-between border-b px-4">
                <span className="font-semibold">Menu</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="space-y-1 p-4">
                {sidebarLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent min-h-[44px]"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="lg:pl-64 pb-nav-mobile lg:pb-0">
        <div className="container mx-auto page-x py-5 sm:py-6 md:py-8 max-w-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background safe-bottom safe-x">
        <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around">
          {mobileNavLinks.map((link) => {
            const isActive =
              link.to === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] sm:text-xs',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <link.icon className="h-5 w-5 shrink-0" />
                <span className="truncate max-w-full">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
