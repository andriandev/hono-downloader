import { z } from 'zod';

const urlYoutube = z
  .string({
    required_error: 'Missing url query',
  })
  .url('URL is not valid')
  .refine(
    (val) =>
      val.includes('://m.youtube.com/') ||
      val.includes('://www.youtube.com/') ||
      val.includes('://youtube.com/') ||
      val.includes('://youtu.be/'),
    { message: 'Only YouTube URLs are allowed' }
  );

export class YoutubeValidation {
  static INFO = z.object({
    url: urlYoutube,
  });

  static AUDIO = z.object({
    url: urlYoutube,
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
    url: urlYoutube,
    quality: z
      .enum(['1080p', '720p', '480p', '360p'], {
        errorMap: () => ({
          message: 'Quality must be one of 1080p, 720p, 480p, or 360p',
        }),
      })
      .default('360p'),
    format: z
      .enum(['mp4', 'mkv'], {
        errorMap: () => ({
          message: 'Format must be either mp4 or mkv',
        }),
      })
      .default('mp4'),
  });
}

export type InfoTypes = z.infer<typeof YoutubeValidation.INFO>;
export type AudioTypes = z.infer<typeof YoutubeValidation.AUDIO>;
export type VideoTypes = z.infer<typeof YoutubeValidation.VIDEO>;
