import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { authService } from '@/services/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function ProfilePage() {
  const { user, business, businessRole } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Your account information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{user.firstName} {user.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Email verified</p>
            <Badge variant={user.emailVerified ? 'success' : 'warning'}>
              {user.emailVerified ? 'Verified' : 'Pending'}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Platform role</p>
            <Badge variant="outline">{user.role}</Badge>
          </div>
        </CardContent>
      </Card>

      {business && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Studio name</p>
              <p className="font-medium">{business.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Business role</p>
              <Badge variant="outline">{businessRole}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
