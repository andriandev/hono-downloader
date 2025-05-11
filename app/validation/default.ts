import { z } from 'zod';

const urlDefault = z
  .string({
    required_error: 'Missing url query',
  })
  .url('URL is not valid')
  .refine(
    (val) =>
      val.includes('://www.tiktok.com/') ||
      val.includes('://m.tiktok.com/') ||
      val.includes('://www.instagram.com/') ||
      val.includes('://instagram.com/') ||
      val.includes('://www.facebook.com/') ||
      val.includes('://m.facebook.com/'),
    { message: 'Only TikTok, Facebook and InstaGram URLs are allowed' }
  );

export class DefaultValidation {
  static AUDIO = z.object({
    url: urlDefault,
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
    url: urlDefault,
    format: z
      .enum(['mp4', 'mkv'], {
        errorMap: () => ({
          message: 'Format must be either mp4 or mkv',
        }),
      })
      .default('mp4'),
  });
}

export type AudioTypes = z.infer<typeof DefaultValidation.AUDIO>;
export type VideoTypes = z.infer<typeof DefaultValidation.VIDEO>;
