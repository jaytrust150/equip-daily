import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import handler from '../bible-chapter.js';
import { createReq, createRes, mockFetch } from './testUtils.js';

const API_KEY = 'test-key';

describe('api/bible-chapter', () => {
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

  it('returns 400 for missing params', async () => {
    const req = createReq({ method: 'GET', query: { bibleId: 'x' } });
    const res = createRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Missing required parameters: bibleId, bookId, chapter',
    });
  });

  it('returns 500 when API key missing', async () => {
    delete process.env.BIBLE_API_KEY;
    const req = createReq({ method: 'GET', query: { bibleId: 'x', bookId: 'GEN', chapter: '1' } });
    const res = createRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Server configuration error: Missing API key',
    });
  });

  it('returns 200 on success', async () => {
    mockFetch({ ok: true, status: 200, jsonData: { data: { id: 'GEN.1' } } });
    const req = createReq({ method: 'GET', query: { bibleId: 'x', bookId: 'GEN', chapter: '1' } });
    const res = createRes();

    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledOnce();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: { id: 'GEN.1' } });
  });

  it('returns unauthorized flag on 401', async () => {
    mockFetch({ ok: false, status: 401, statusText: 'Unauthorized', textData: 'nope' });
    const req = createReq({ method: 'GET', query: { bibleId: 'x', bookId: 'GEN', chapter: '1' } });
    const res = createRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'API error: 401',
      message: 'Unauthorized',
      unauthorized: true,
    });
  });
});
