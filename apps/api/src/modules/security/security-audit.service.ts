import type { SecurityAuditFinding, SecurityAuditReport } from '@photo-platform/shared-types';
import { loadEnv } from '@photo-platform/config';

function finding(
  id: string,
  severity: SecurityAuditFinding['severity'],
  message: string,
  passed: boolean,
): SecurityAuditFinding {
  return { id, severity, message, passed };
}

export const securityAuditService = {
  async runAudit(): Promise<SecurityAuditReport> {
    const env = loadEnv();
    const findings: SecurityAuditFinding[] = [];

    findings.push(
      finding(
        'jwt-secret-length',
        'critical',
        'JWT_SECRET should be at least 32 characters',
        env.JWT_SECRET.length >= 32,
      ),
      finding(
        'jwt-refresh-secret-length',
        'critical',
        'JWT_REFRESH_SECRET should be at least 32 characters',
        env.JWT_REFRESH_SECRET.length >= 32,
      ),
      finding(
        'cors-origin-restricted',
        'warning',
        'CORS_ORIGIN should not be wildcard in production',
        env.NODE_ENV !== 'production' || (!env.CORS_ORIGIN.includes('*') && env.CORS_ORIGIN.length > 0),
      ),
      finding(
        'production-node-env',
        'info',
        'NODE_ENV is set to production',
        env.NODE_ENV === 'production',
      ),
      finding(
        'razorpay-configured',
        'warning',
        'Razorpay credentials are configured for billing',
        Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET),
      ),
      finding(
        'webhook-secret',
        'warning',
        'Razorpay webhook secret is configured',
        Boolean(env.RAZORPAY_WEBHOOK_SECRET),
      ),
      finding(
        'storage-root-set',
        'info',
        'Storage root path is configured',
        env.STORAGE_ROOT.length > 0,
      ),
    );

    const hasCriticalFailure = findings.some((item) => !item.passed && item.severity === 'critical');
    const hasWarningFailure = findings.some((item) => !item.passed && item.severity === 'warning');

    return {
      generatedAt: new Date().toISOString(),
      overallStatus: hasCriticalFailure ? 'fail' : hasWarningFailure ? 'warn' : 'pass',
      findings,
    };
  },
};
