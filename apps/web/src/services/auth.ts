import type { AuthSession } from '@/types/domain';
import { UserRole } from '@/types/domain';
import type { LoginInput, RegisterInput } from '@/lib/schemas';
import { getBoltClient } from '@/lib/bolt/client';
import { getBoltEnv } from '@/lib/bolt/config';
import { localDemo } from '@/lib/bolt/local-demo';
import { logDebug } from '@/lib/bolt/debug-log';
import { useAuthStore } from '@/stores/auth-store';

async function mapSupabaseSession(
  accessToken: string,
  userId: string,
  email: string,
  metadata: Record<string, unknown>,
): Promise<AuthSession> {
  const supabase = getBoltClient()!;
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  const firstName = (profile?.first_name as string) || (metadata.first_name as string) || 'Photographer';
  const lastName = (profile?.last_name as string) || (metadata.last_name as string) || '';
  const businessName = (profile?.business_name as string) || (metadata.business_name as string) || 'My Studio';

  return {
    accessToken,
    user: {
      id: userId,
      email,
      firstName,
      lastName,
      role: UserRole.OWNER,
      emailVerified: true,
    },
    business: {
      id: userId,
      name: businessName,
      slug: businessName.toLowerCase().replace(/\s+/g, '-').slice(0, 48),
    },
    businessRole: UserRole.OWNER,
  };
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthSession> {
    if (!getBoltEnv().configured) {
      const session = localDemo.register(input);
      useAuthStore.getState().setSession(session);
      return session;
    }

    const supabase = getBoltClient()!;
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          business_name: input.businessName,
        },
      },
    });
    if (error) throw error;
    if (!data.session || !data.user) throw new Error('Registration incomplete — check email confirmation settings.');

    await supabase.from('profiles').upsert({
      id: data.user.id,
      first_name: input.firstName,
      last_name: input.lastName,
      business_name: input.businessName,
    });

    const session = await mapSupabaseSession(
      data.session.access_token,
      data.user.id,
      data.user.email ?? input.email,
      data.user.user_metadata ?? {},
    );
    useAuthStore.getState().setSession(session);
    return session;
  },

  async login(input: LoginInput): Promise<AuthSession> {
    if (!getBoltEnv().configured) {
      const session = localDemo.login(input);
      useAuthStore.getState().setSession(session);
      return session;
    }

    const supabase = getBoltClient()!;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) throw error;
    if (!data.session || !data.user) throw new Error('Login failed');

    const session = await mapSupabaseSession(
      data.session.access_token,
      data.user.id,
      data.user.email ?? input.email,
      data.user.user_metadata ?? {},
    );
    useAuthStore.getState().setSession(session);
    return session;
  },

  async refresh(): Promise<AuthSession | null> {
    if (!getBoltEnv().configured) {
      const session = localDemo.loadSession();
      if (session) useAuthStore.getState().setSession(session);
      return session;
    }

    const supabase = getBoltClient()!;
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) return null;

    const session = await mapSupabaseSession(
      data.session.access_token,
      data.session.user.id,
      data.session.user.email ?? '',
      data.session.user.user_metadata ?? {},
    );
    useAuthStore.getState().setSession(session);
    return session;
  },

  async logout(): Promise<void> {
    try {
      if (getBoltEnv().configured) {
        await getBoltClient()?.auth.signOut();
      }
    } finally {
      localDemo.clearSession();
      useAuthStore.getState().clearSession();
    }
  },

  async initialize(): Promise<void> {
    const store = useAuthStore.getState();
    try {
      await authService.refresh();
    } catch (err) {
      logDebug('warn', 'Auth initialize failed', { error: err });
      store.clearSession();
    } finally {
      store.setInitialized(true);
    }
  },
};
