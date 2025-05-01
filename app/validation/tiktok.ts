import { z } from 'zod';

const urlTiktok = z
  .string({
    required_error: 'Missing url query',
  })
  .url('URL is not valid')
  .refine(
    (val) =>
      val.includes('://www.tiktok.com/') || val.includes('://m.tiktok.com/'),
    { message: 'Only TikTok URLs are allowed' }
  );

export class TiktokValidation {
  static INFO = z.object({
    url: urlTiktok,
  });

  static AUDIO = z.object({
    url: urlTiktok,
    quality: z
      .enum(['0', '5', '9'], {
        errorMap: () => ({
          message: 'Quality must be one of 0, 5, or 9',
        }),
      })
      .default('5'),
    format: z
      .enum(['mp3', 'm4a', 'flac', 'opus'], {
        errorMap: () => ({
          message: 'Format must be one of mp3, m4a, flac, opus',
        }),
      })
      .default('mp3'),
  });

  static VIDEO = z.object({
    url: urlTiktok,
    format: z
      .enum(['mp4', 'mkv'], {
        errorMap: () => ({
          message: 'Format must be either mp4 or mkv',
        }),
      })
      .default('mp4'),
  });
}

export type InfoTypes = z.infer<typeof TiktokValidation.INFO>;
export type AudioTypes = z.infer<typeof TiktokValidation.AUDIO>;
export type VideoTypes = z.infer<typeof TiktokValidation.VIDEO>;
