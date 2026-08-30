import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('API integration', () => {
  const app = createApp();

  it('GET /api/v1/health returns healthy status', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('healthy');
    expect(response.body.data.version).toBe('0.1.0');
  });

  it('GET /api/v1/events requires authentication', async () => {
    const response = await request(app).get('/api/v1/events');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/admin requires super admin auth', async () => {
    const response = await request(app).get('/api/v1/admin/overview');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('returns 404 for unknown routes', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
