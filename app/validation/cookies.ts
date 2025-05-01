import { z } from 'zod';

export class CookiesValidation {
  static UPLOAD = z.object({
    site: z.enum(['youtube', 'tiktok'], {
      errorMap: () => ({
        message: 'Query site must be either youtube or tiktok',
      }),
    }),
  });
}
