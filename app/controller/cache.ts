import { Context } from 'hono';
import { cache } from '@app/config/cache';
import { resJSON } from '@app/helpers/function';

export function FlushCache(c: Context) {
  const secretKey = c.req.query('key');

  if (secretKey !== process.env.APP_SECRET_KEY) {
    const resData = resJSON({
      statusCode: 401,
      message: 'Access denied, wrong key',
    });

    return c.json(resData, resData.status as 401);
  }

  cache.flushAll();

  const resData = resJSON({
    message: 'Successfully cleared all cache',
  });

  return c.json(resData, resData.status as 200);
}
