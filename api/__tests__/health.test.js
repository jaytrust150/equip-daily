import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from '../health.js';
import { createReq, createRes } from './testUtils.js';

const API_KEY = 'test-key';

describe('api/health', () => {
  beforeEach(() => {
    process.env.BIBLE_API_KEY = API_KEY;
    delete process.env.VITE_BIBLE_API_KEY;
  });

  afterEach(() => {
    delete process.env.BIBLE_API_KEY;
    delete process.env.VITE_BIBLE_API_KEY;
    global.fetch = undefined;
  });

  it('returns 405 for non-GET', async () => {
    const req = createReq({ method: 'POST' });
    const res = createRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('returns healthy status when API is reachable', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: [{ id: 'x' }] }),
        status: 200,
        statusText: 'OK',
      })
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const req = createReq({ method: 'GET' });
    const res = createRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.status).toBe('healthy');
    expect(payload.checks.environment.status).toBe('ok');
    expect(payload.checks.bibleAPI.status).toBe('ok');
  });
});
