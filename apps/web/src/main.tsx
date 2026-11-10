import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthInitializer } from '@/components/AuthInitializer';
import { logDebug } from '@/lib/bolt/debug-log';
import { router } from '@/routes';
import '@/index.css';

window.addEventListener('error', (event) => {
  logDebug('error', event.message, { detail: event.filename, context: { line: event.lineno } });
});

window.addEventListener('unhandledrejection', (event) => {
  logDebug('error', 'Unhandled promise rejection', { error: event.reason });
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <RouterProvider router={router} />
      </AuthInitializer>
    </QueryClientProvider>
  </StrictMode>,
);
