import fs from 'fs';
import path from 'path';
import { Context } from 'hono';
import { resJSON } from '@app/helpers/function';
import { CookiesValidation } from '@app/validation/cookies';

export async function UploadCookies(c: Context) {
  const body = await c.req.parseBody();
  const rawQuery = c.req.query('site');

  const request = CookiesValidation.UPLOAD.parse({ site: rawQuery });

  const file = body['cookies'];

  if (!file || !(file instanceof File)) {
    return c.json(
      resJSON({ statusCode: 400, message: 'No file uploaded' }),
      400
    );
  }

  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filename = `cookies_${request.site}_${Date.now()}.txt`;
  const filepath = path.join(tempDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filepath, buffer);

  return c.json(resJSON({ message: 'File uploaded' }), 200);
}

export async function ClearCookies(c: Context) {
  const key = c.req.query('key');

  if (key !== process.env.APP_SECRET_KEY) {
    return c.json(
      resJSON({
        statusCode: 401,
        message: 'Access denied, please include the key',
      }),
      401
    );
  }

  const tempDir = path.join(process.cwd(), 'temp');

  if (!fs.existsSync(tempDir)) {
    return c.json(
      resJSON({ statusCode: 400, message: 'Temp folder does not exist' }),
      400
    );
  }

  const files = fs.readdirSync(tempDir);
  const cookieFiles = files.filter(
    (f) => f.startsWith('cookies_') && f.endsWith('.txt')
  );

  for (const file of cookieFiles) {
    fs.unlinkSync(path.join(tempDir, file));
  }

  return c.json(
    resJSON({
      message: 'All cookie files deleted',
      deleted: cookieFiles.length,
    })
  );
}
