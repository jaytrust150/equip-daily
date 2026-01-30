import { vi } from 'vitest';

export function createReq({ method = 'GET', query = {} } = {}) {
  return { method, query };
}

export function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
  };
}

export function mockFetch({ ok = true, status = 200, statusText = 'OK', jsonData = {}, textData = '' } = {}) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    statusText,
    json: vi.fn().mockResolvedValue(jsonData),
    text: vi.fn().mockResolvedValue(textData),
  });
}
