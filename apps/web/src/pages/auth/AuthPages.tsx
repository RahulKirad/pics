import type { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from '@photo-platform/validation';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { authService } from '@/services/auth';
import { getErrorMessage } from '@/services/api';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const SUPER_ADMIN = 'SUPER_ADMIN';

function AuthCardChrome({ children }: { children: ReactNode }) {
  return (
    <div className="auth-login-card">
      <div className="mb-6 flex justify-center">
        <BrandLogo size="lg" imageClassName="!max-h-[72px] !h-auto mx-auto" className="justify-center" />
      </div>
      {children}
      <div className="auth-login-security">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} aria-hidden />
        Your photos and account details stay secure
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const from = (location.state as { from?: string })?.from ?? '/dashboard';

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setInfo(null);
    try {
      const session = await authService.login(data);
      const redirect = session.user.role === SUPER_ADMIN && from.startsWith('/admin')
        ? from
        : session.user.role === SUPER_ADMIN
          ? '/dashboard'
          : from;
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const onForgotPassword = () => {
    setError(null);
    const email = getValues('email')?.trim();
    if (!email) {
      setInfo(null);
      setError('Enter your email address first, then select “Forgot password?” again.');
      return;
    }
    setError(null);
    setInfo(`Password reset can be requested for ${email}. Connect your password-reset service to enable this action.`);
  };

  return (
    <AuthSplitLayout>
      <AuthCardChrome>
        <div className="auth-login-heading">
          <h2>Welcome back</h2>
          <p>Sign in to your PicShareNow account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="auth-login-field">
            <div className="auth-login-field-head">
              <label htmlFor="email">Email address</label>
            </div>
            <input
              id="email"
              type="email"
              placeholder="you@studio.com"
              autoComplete="username"
              className="auth-login-input"
              {...register('email')}
            />
            {errors.email ? <p className="auth-field-error">{errors.email.message}</p> : null}
          </div>

          <div className="auth-login-field">
            <div className="auth-login-field-head">
              <label htmlFor="password">Password</label>
              <button type="button" className="auth-login-forgot" onClick={onForgotPassword}>
                Forgot password?
              </button>
            </div>
            <div className="auth-login-input-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="auth-login-input auth-login-input--password"
                {...register('password')}
              />
              <button
                type="button"
                className="auth-login-toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-[19px] w-[19px]" /> : <Eye className="h-[19px] w-[19px]" />}
              </button>
            </div>
            {errors.password ? <p className="auth-field-error">{errors.password.message}</p> : null}
          </div>

          <div className="auth-login-options">
            <label className="auth-login-remember">
              <input type="checkbox" name="remember" />
              Remember me
            </label>
          </div>

          <button type="submit" className="auth-login-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>

          {error ? (
            <div className="auth-login-message auth-login-message--error" role="alert">
              {error}
            </div>
          ) : null}
          {info ? (
            <div className="auth-login-message auth-login-message--success" role="status">
              {info}
            </div>
          ) : null}
        </form>

        <p className="auth-login-register">
          Don&apos;t have an account?
          <Link to="/register">Register</Link>
        </p>
      </AuthCardChrome>
    </AuthSplitLayout>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    try {
      await authService.register(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <AuthSplitLayout>
      <AuthCardChrome>
        <div className="auth-login-heading">
          <h2>Start your free trial</h2>
          <p>Create your PicShareNow account — no credit card required</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="auth-register-name-grid">
            <div className="auth-login-field auth-login-field--compact">
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                autoComplete="given-name"
                className="auth-login-input"
                {...register('firstName')}
              />
              {errors.firstName ? <p className="auth-field-error">{errors.firstName.message}</p> : null}
            </div>
            <div className="auth-login-field auth-login-field--compact">
              <label htmlFor="lastName">Last name</label>
              <input id="lastName" autoComplete="family-name" className="auth-login-input" {...register('lastName')} />
              {errors.lastName ? <p className="auth-field-error">{errors.lastName.message}</p> : null}
            </div>
          </div>

          <div className="auth-login-field">
            <label htmlFor="businessName">Studio name</label>
            <input
              id="businessName"
              placeholder="Your photography studio"
              className="auth-login-input"
              {...register('businessName')}
            />
            {errors.businessName ? <p className="auth-field-error">{errors.businessName.message}</p> : null}
          </div>

          <div className="auth-login-field">
            <label htmlFor="regEmail">Email address</label>
            <input
              id="regEmail"
              type="email"
              placeholder="you@studio.com"
              autoComplete="email"
              className="auth-login-input"
              {...register('email')}
            />
            {errors.email ? <p className="auth-field-error">{errors.email.message}</p> : null}
          </div>

          <div className="auth-login-field">
            <label htmlFor="regPassword">Password</label>
            <div className="auth-login-input-wrap">
              <input
                id="regPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a strong password"
                className="auth-login-input auth-login-input--password"
                {...register('password')}
              />
              <button
                type="button"
                className="auth-login-toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-[19px] w-[19px]" /> : <Eye className="h-[19px] w-[19px]" />}
              </button>
            </div>
            {errors.password ? <p className="auth-field-error">{errors.password.message}</p> : null}
          </div>

          <button type="submit" className="auth-login-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Start Free Trial'}
          </button>

          {error ? (
            <div className="auth-login-message auth-login-message--error" role="alert">
              {error}
            </div>
          ) : null}
        </form>

        <p className="auth-login-register">
          Already have an account?
          <Link to="/login">Sign in</Link>
        </p>
      </AuthCardChrome>
    </AuthSplitLayout>
  );
}
