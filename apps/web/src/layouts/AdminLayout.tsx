import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  Image,
  HardDrive,
  Brain,
  CreditCard,
  Receipt,
  ScrollText,
  Settings,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const adminNavSections = [
  {
    title: 'Overview',
    links: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    ],
  },
  {
    title: 'Management',
    links: [
      { to: '/admin/businesses', icon: Building2, label: 'Businesses' },
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/admin/events', icon: Calendar, label: 'Events' },
      { to: '/admin/photos', icon: Image, label: 'Photos' },
    ],
  },
  {
    title: 'Infrastructure',
    links: [
      { to: '/admin/storage', icon: HardDrive, label: 'Storage' },
      { to: '/admin/ai-processing', icon: Brain, label: 'Job Queues' },
    ],
  },
  {
    title: 'Billing',
    links: [
      { to: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
      { to: '/admin/payments', icon: Receipt, label: 'Payments' },
    ],
  },
  {
    title: 'System',
    links: [
      { to: '/admin/audit-logs', icon: ScrollText, label: 'Audit Logs' },
      { to: '/admin/privacy', icon: Shield, label: 'Privacy & Security' },
      { to: '/admin/settings', icon: Settings, label: 'System Settings' },
    ],
  },
];

function NavLink({
  to,
  icon: Icon,
  label,
  end,
  onClick,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  end?: boolean;
  onClick?: () => void;
}) {
  const location = useLocation();
  const active = end
    ? location.pathname === to
    : location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[40px]',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col border-r bg-background">
        <div className="flex h-16 items-center gap-3 border-b px-6">
          <Shield className="h-5 w-5" />
          <div>
            <span className="font-semibold block leading-tight">Admin Console</span>
            <Badge variant="outline" className="mt-0.5 text-[10px]">Super Admin</Badge>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {adminNavSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.links.map((link) => (
                  <NavLink key={link.to} {...link} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-40 border-b bg-background safe-top">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="font-semibold text-sm">Admin Console</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent"
            aria-label="Open admin menu"
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
              className="fixed inset-y-0 left-0 z-50 w-80 border-r bg-background lg:hidden overflow-y-auto safe-top"
            >
              <div className="flex h-14 items-center justify-between border-b px-4">
                <span className="font-semibold">Admin Navigation</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="p-4 space-y-6">
                {adminNavSections.map((section) => (
                  <div key={section.title}>
                    <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {section.title}
                    </p>
                    <div className="space-y-0.5">
                      {section.links.map((link) => (
                        <NavLink key={link.to} {...link} onClick={() => setSidebarOpen(false)} />
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="lg:pl-72">
        <div className="border-b bg-background px-4 py-4 md:px-8 hidden lg:block">
          <p className="text-sm text-muted-foreground">
            Platform administration — access via direct URL only
          </p>
        </div>
        <div className="container mx-auto px-4 py-6 md:px-8 md:py-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
