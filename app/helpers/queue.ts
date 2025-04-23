import fs from 'fs';
import path from 'path';
import { cache } from '@app/config/cache';
import { AUDIO_DIR, VIDEO_DIR } from '@app/config/setting';
import { logger } from '@app/config/logging';
import { APP_NODE, YTDLP_PATH, FFMPEG_PATH } from '@app/config/setting';

export function startQueue() {
  function processVideoQueue() {
    APP_NODE !== 'production' ? logger.info('Queue video running...') : '';
    const keys = cache.keys();

    for (const key of keys) {
      if (!key.endsWith('.mp4') && !key.endsWith('.mkv')) continue;

      const filepath = path.join(VIDEO_DIR, key);

      if (fs.existsSync(filepath)) {
        cache.del(key);
        continue;
      }

      const data: Record<string, string> = cache.get(key);

      const formatMap = {
        '1080p': 'bestvideo[height<=1080]+bestaudio',
        '720p': 'bestvideo[height<=720]+bestaudio',
        '480p': 'bestvideo[height<=480]+bestaudio',
        '360p': 'bestvideo[height<=360]+bestaudio',
      };
      const selectedFormat = formatMap[data.quality];

      const args = [
        YTDLP_PATH,
        '-f',
        selectedFormat,
        '--merge-output-format',
        data.format,
        '--ffmpeg-location',
        FFMPEG_PATH,
        '-o',
        filepath,
        data.url,
      ];

      const proc = Bun.spawn(args, {
        stdout: 'pipe',
        stderr: 'pipe',
      });

      proc.exited.then(async (exit) => {
        if (exit === 0) {
          logger.info(`Queue video ${key} success.`);
          cache.del(key);
        } else {
          const stderr = await new Response(proc.stderr).text();
          logger.error(stderr);
          logger.error(`Queue video ${key} failed.`);
        }
      });
    }
  }

  function processAudioQueue() {
    APP_NODE !== 'production' ? logger.info('Queue audio running...') : '';
    const keys = cache.keys();

    for (const key of keys) {
      if (
        !key.endsWith('.mp3') &&
        !key.endsWith('.m4a') &&
        !key.endsWith('.flac') &&
        !key.endsWith('.opus')
      )
        continue;

      const filepath = path.join(AUDIO_DIR, key);

      if (fs.existsSync(filepath)) {
        cache.del(key);
        continue;
      }

      const data: Record<string, string> = cache.get(key);

      const args = [
        YTDLP_PATH,
        '-x',
        '--audio-quality',
        data.quality,
        '--audio-format',
        data.format,
        '--ffmpeg-location',
        FFMPEG_PATH,
        '-o',
        filepath,
        data.url,
      ];

      const proc = Bun.spawn(args, {
        stdout: 'pipe',
        stderr: 'pipe',
      });

      proc.exited.then(async (exit) => {
        if (exit === 0) {
          logger.info(`Queue audio ${key} success.`);
          cache.del(key);
        } else {
          const stderr = await new Response(proc.stderr).text();
          logger.error(stderr);
          logger.error(`Queue audio ${key} failed.`);
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
