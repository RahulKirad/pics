import { useEffect } from 'react';
import { authService } from '@/services/auth';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    authService.initialize();
  }, []);

  return <>{children}</>;
}
