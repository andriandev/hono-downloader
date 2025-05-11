import fs from 'fs';
import path from 'path';
import { cache } from '@app/config/cache';
import {
  AUDIO_DIR,
  VIDEO_DIR,
  YTDLP_PATH,
  FFMPEG_PATH,
} from '@app/config/setting';
import { logger } from '@app/config/logging';
import { getLatestCookiePath } from '@helpers/function';

export function startQueue() {
  function processVideoQueue() {
    logger.info('Queue video running...');

    const keys = cache.keys();
    const filtered = keys.filter(
      (k) => k.endsWith('.mp4') || k.endsWith('.mkv')
    );
    const firstThree = filtered.slice(0, 3);

    for (const key of firstThree) {
      const filepath = path.join(VIDEO_DIR, key);

      if (fs.existsSync(filepath)) {
        cache.del(key);
        continue;
      }

      const data: Record<string, string> = cache.get(key);

      const cookiePath = getLatestCookiePath(data.site);

      let args: any;

      if (data.site == 'youtube') {
        const formatMap = {
          '1080p': 'bestvideo[height<=1080]+bestaudio',
          '720p': 'bestvideo[height<=720]+bestaudio',
          '480p': 'bestvideo[height<=480]+bestaudio',
          '360p': 'bestvideo[height<=360]+bestaudio',
        };

        args = [
          YTDLP_PATH,
          '-f',
          formatMap[data.quality],
          '--merge-output-format',
          data.format,
          '--ffmpeg-location',
          FFMPEG_PATH,
        ];
      } else {
        args = [
          YTDLP_PATH,
          '--merge-output-format',
          data.format,
          '--ffmpeg-location',
          FFMPEG_PATH,
        ];
      }

      if (cookiePath) {
        args.push('--cookies', cookiePath);
      }

      args.push('-o', filepath, data.url);

      const proc = Bun.spawn(args, {
        stdout: 'pipe',
        stderr: 'pipe',
      });

      proc.exited.then(async (exit) => {
        if (exit === 0) {
          console.log(`Queue video ${key} success.`);
          cache.del(key);
        } else {
          const stderr = await new Response(proc.stderr).text();
          logger.error(stderr);
          logger.error(`Queue video ${key} failed.`);
          cache.del(key);
        }
      });
    }
  }

  function processAudioQueue() {
    logger.info('Queue audio running...');

    const keys = cache.keys();
    const filtered = keys.filter(
      (k) =>
        k.endsWith('.mp3') ||
        k.endsWith('.m4a') ||
        k.endsWith('.flac') ||
        k.endsWith('.opus')
    );
    const firstThree = filtered.slice(0, 3);

    for (const key of firstThree) {
      const filepath = path.join(AUDIO_DIR, key);

      if (fs.existsSync(filepath)) {
        cache.del(key);
        continue;
      }

      const data: Record<string, string> = cache.get(key);

      const cookiePath = getLatestCookiePath(data.site);

      let args: any;

      if (data.site == 'youtube') {
        args = [
          YTDLP_PATH,
          '-x',
          '--audio-quality',
          data.quality,
          '--audio-format',
          data.format,
          '--ffmpeg-location',
          FFMPEG_PATH,
        ];
      } else {
        args = [
          YTDLP_PATH,
          '-x',
          '--no-playlist',
          '--audio-quality',
          data.quality,
          '--audio-format',
          data.format,
          '--ffmpeg-location',
          FFMPEG_PATH,
        ];
      }

      if (cookiePath) {
        args.push('--cookies', cookiePath);
      }

      args.push('-o', filepath, data.url);

      const proc = Bun.spawn(args, {
        stdout: 'pipe',
        stderr: 'pipe',
      });

      proc.exited.then(async (exit) => {
        if (exit === 0) {
          console.log(`Queue audio ${key} success.`);
          cache.del(key);
        } else {
          const stderr = await new Response(proc.stderr).text();
          logger.error(stderr);
          logger.error(`Queue audio ${key} failed.`);
          cache.del(key);
        }
      });
    }
  }

  const queueProcessors = [
    processVideoQueue,
    processAudioQueue,
    // Other Queue
  ];

  let currentIndex = 0;

  setInterval(() => {
    const processor = queueProcessors[currentIndex];
    processor();

    currentIndex = (currentIndex + 1) % queueProcessors.length;
  }, 60000); // 1 minutes
}
