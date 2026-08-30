import { Outlet } from 'react-router-dom';

export function GuestLayout() {
  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <Outlet />
    </div>
  );
}
