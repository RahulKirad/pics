import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { FooterNavLink, MarketingNavLink } from '@/components/marketing/MarketingNavLink';
import { FOOTER_LINKS, HEADER_NAV } from '@/constants/marketing-nav';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import '@/styles/landing.css';

export function MarketingLayout() {
  const { pathname, hash } = useLocation();
  const isHome = pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (hash) {
      const id = hash.replace(/^#/, '');
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  const headerLinkClass = isHome
    ? 'landing-nav-link text-[#0f172a]'
    : 'text-sm text-muted-foreground hover:text-foreground';

  return (
    <div className={`min-h-screen flex flex-col ${isHome ? 'landing-page' : ''}`}>
      <header
        className={`sticky top-0 z-50 safe-top ${isHome ? 'landing-header' : 'border-b bg-background/95 backdrop-blur'} ${
          scrolled && isHome ? 'scrolled' : ''
        } ${!isHome ? 'border-border' : ''}`}
      >
        <div className="mx-auto flex h-[74px] max-w-[1180px] items-center justify-between px-6">
          <BrandLogo linkToHome size="md" />

          <nav className="hidden items-center gap-8 md:flex">
            {HEADER_NAV.map((link) => (
              <MarketingNavLink
                key={link.page}
                to={link.page}
                homeSection={link.homeSection}
                className={headerLinkClass}
              >
                {link.label}
              </MarketingNavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className={`hidden text-sm font-medium md:inline ${isHome ? 'text-[#0f172a]' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Log in
            </Link>
            <Link
              to="/register"
              className={isHome ? 'landing-btn-primary !py-2.5 !text-sm' : 'inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'}
            >
              Start Free Trial
            </Link>
            <button
              type="button"
              className="md:hidden"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-[#e6eaf3] bg-white px-6 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              {HEADER_NAV.map((link) => (
                <MarketingNavLink
                  key={link.page}
                  to={link.page}
                  homeSection={link.homeSection}
                  className="font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </MarketingNavLink>
              ))}
              <Link to="/login" className="font-medium">
                Log in
              </Link>
            </div>
          </div>
        )}
      </header>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1"
      >
        <Outlet />
      </motion.main>

      <footer id="contact" className="scroll-mt-24 bg-[#0a1446] py-14 text-[#cbd5e1] safe-bottom">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <motion.div className="inline-flex rounded-xl bg-white px-3 py-2.5">
                <BrandLogo size="lg" />
              </motion.div>
              <p className="mt-4 max-w-sm text-sm">
                The smartest way for photographers to share event photos using QR codes and AI face recognition.
              </p>
            </div>
            <div>
              <h6 className="mb-3 text-sm font-semibold text-white">Product</h6>
              <ul className="space-y-2 text-sm">
                {FOOTER_LINKS.product.map((item) => (
                  <li key={item.to}>
                    <FooterNavLink to={item.to}>{item.label}</FooterNavLink>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h6 className="mb-3 text-sm font-semibold text-white">Resources</h6>
              <ul className="space-y-2 text-sm">
                {FOOTER_LINKS.resources.map((item) => (
                  <li key={item.to}>
                    <FooterNavLink to={item.to}>{item.label}</FooterNavLink>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h6 className="mb-3 text-sm font-semibold text-white">Company</h6>
              <ul className="space-y-2 text-sm">
                {FOOTER_LINKS.company.map((item) => (
                  <li key={item.to}>
                    <FooterNavLink to={item.to}>{item.label}</FooterNavLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <motion.div className="mt-10 border-t border-white/10 pt-6 text-center text-sm">
            &copy; {new Date().getFullYear()} PicShareNow. All rights reserved.
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
