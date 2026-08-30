import { describe, it, expect, vi, beforeEach } from 'vitest';

const { loadEnv } = vi.hoisted(() => ({
  loadEnv: vi.fn(),
}));

vi.mock('@photo-platform/config', () => ({
  loadEnv,
}));

import { securityAuditService } from './security-audit.service.js';

function mockEnv(overrides: Record<string, string> = {}) {
  return {
    NODE_ENV: 'development',
    JWT_SECRET: 'x'.repeat(32),
    JWT_REFRESH_SECRET: 'y'.repeat(32),
    CORS_ORIGIN: 'http://localhost:5173',
    RAZORPAY_KEY_ID: '',
    RAZORPAY_KEY_SECRET: '',
    RAZORPAY_WEBHOOK_SECRET: '',
    STORAGE_ROOT: '/data/photo-platform',
    ...overrides,
  };
}

describe('securityAuditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes when critical secrets meet minimum length', async () => {
    loadEnv.mockReturnValue(mockEnv());

    const report = await securityAuditService.runAudit();

    expect(report.overallStatus).toBe('warn');
    expect(report.findings.find((item) => item.id === 'jwt-secret-length')?.passed).toBe(true);
    expect(report.findings.find((item) => item.id === 'jwt-refresh-secret-length')?.passed).toBe(true);
  });

  it('fails when JWT secrets are too short', async () => {
    loadEnv.mockReturnValue(mockEnv({ JWT_SECRET: 'short', JWT_REFRESH_SECRET: 'short' }));

    const report = await securityAuditService.runAudit();

    expect(report.overallStatus).toBe('fail');
    expect(report.findings.filter((item) => item.severity === 'critical' && !item.passed)).toHaveLength(2);
  });

  it('warns on wildcard CORS in production', async () => {
    loadEnv.mockReturnValue(mockEnv({ NODE_ENV: 'production', CORS_ORIGIN: '*' }));

    const report = await securityAuditService.runAudit();
    const corsFinding = report.findings.find((item) => item.id === 'cors-origin-restricted');

    expect(corsFinding?.passed).toBe(false);
    expect(report.overallStatus).toBe('warn');
  });
});
