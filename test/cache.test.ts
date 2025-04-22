import { describe, it, expect, beforeAll } from 'bun:test';
import { app } from '../index';
import { cache } from '@app/config/cache';

describe('GET /cache/flush', () => {
  beforeAll(() => {
    cache.set('testKey', 'testValue');
  });

  it('should deny access with wrong key', async () => {
    const res = await app.request('/cache/flush?key=wrongkey');

    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.message).toBe('Access denied, wrong key');
  });

  it('should clear cache with correct key', async () => {
    cache.set('dummy', '123');
    const res = await app.request(
      `/cache/flush?key=${process.env.APP_SECRET_KEY}`
    );

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe('Successfully cleared all cache');
    expect(cache.get('dummy')).toBeUndefined();
  });
});
