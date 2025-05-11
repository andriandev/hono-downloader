import { z } from 'zod';

export class CookiesValidation {
  static UPLOAD = z.object({
    site: z.enum(['youtube', 'tiktok', 'instagram', 'facebook'], {
      errorMap: () => ({
        message:
          'Query site must be one of youtube, tiktok, instagram, or facebook',
      }),
    }),
  });
}
