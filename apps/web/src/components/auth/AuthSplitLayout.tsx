import type { ReactNode } from 'react';
import { LoginVisualPanel } from '@/components/auth/LoginVisualPanel';
import '@/styles/auth-login.css';

export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-login-page">
      <main className="auth-page-shell">
        <LoginVisualPanel />
        <section className="auth-card-wrap safe-top safe-bottom">
          {children}
          <div className="auth-login-footer">&copy; {new Date().getFullYear()} PicShareNow. All rights reserved.</div>
        </section>
      </main>
    </div>
  );
}
