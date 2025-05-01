import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { TiktokValidation } from '@app/validation/tiktok';
import {
  resJSON,
  checkTikTokVideo,
  getTikTokID,
  formatSize,
  getLatestCookiePath,
} from '@app/helpers/function';
import type {
  InfoTypes,
  AudioTypes,
  VideoTypes,
} from '@app/validation/youtube';
import {
  AUDIO_DIR,
  VIDEO_DIR,
  STORAGE_URL,
  YTDLP_PATH,
  FFMPEG_PATH,
} from '@app/config/setting';
import { cache } from '@app/config/cache';
import { logger } from '@app/config/logging';

export async function InfoVideoTikTok(c: Context) {
  const query: InfoTypes = {
    url: c.req.query('url'),
  };

  const request: InfoTypes = TiktokValidation.INFO.parse(query);

  const data = await checkTikTokVideo(request?.url);

  if (!data) {
    throw new HTTPException(400, {
      message: 'Video not available',
    });
  }

  const resData = resJSON({
    data: data,
  });

  return c.json(resData, resData.status as 200);
}

export async function DownloadVideoTikTok(c: Context) {
  const query = c.req.query();
  const request: VideoTypes = TiktokValidation.VIDEO.parse(query);

  const isAvailable = await checkTikTokVideo(request?.url);

  if (!isAvailable) {
    throw new HTTPException(400, {
      message: 'Video not available',
    });
  }

  if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });

  const { url, format } = request;

  const ttID = getTikTokID(url) || url;
  const hash = createHash('md5')
    .update(`tt-video-${ttID}-${format}`)
    .digest('hex');
  const filename = `${hash}.${format}`;
  const filepath = path.join(VIDEO_DIR, filename);

  if (fs.existsSync(filepath)) {
    const size: number = fs.statSync(filepath).size;

    const resData = resJSON({
      data: {
        size: formatSize(size),
        format,
        link: `${STORAGE_URL}/video/${filename}`,
      },
    });

    return c.json(resData, resData.status as 200);
  }

  const cookiePath = getLatestCookiePath('tiktok');

  const args = [
    YTDLP_PATH,
    '--merge-output-format',
    format,
    '--ffmpeg-location',
    FFMPEG_PATH,
  ];

  if (cookiePath) {
    args.push('--cookies', cookiePath);
  }

  args.push('-o', filepath, url);

  const proc = Bun.spawn(args, {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const exit = await proc.exited;
  if (exit !== 0) {
    const stderr = await new Response(proc.stderr).text();
    logger.error(stderr);

    throw new HTTPException(400, {
      message: `Download failed with code ${exit}, ${stderr}`,
    });
  }

  const size: number = fs.statSync(filepath).size;

  const resData = resJSON({
    data: {
      size: formatSize(size),
      format,
      link: `${STORAGE_URL}/video/${filename}`,
    },
  });

  return c.json(resData, resData.status as 200);
}

export async function DownloadAudioTikTok(c: Context) {
  const query = c.req.query();
  const request: AudioTypes = TiktokValidation.AUDIO.parse(query);

  const isAvailable = await checkTikTokVideo(request?.url);

  if (!isAvailable) {
    throw new HTTPException(400, {
      message: 'Video not available',
    });
  }

  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  const { url, quality, format } = request;

  const ttID = getTikTokID(url) || url;
  const hash = createHash('md5')
    .update(`tt-audio-${ttID}-${quality}-${format}`)
    .digest('hex');
  const filename = `${hash}.${format}`;
  const filepath = path.join(AUDIO_DIR, filename);

  const sizeAudio = {
    '0': '0 => 320kbps',
    '5': '5 => 160kbps',
    '9': '9 => 64kbps',
  };

  if (fs.existsSync(filepath)) {
    const size: number = fs.statSync(filepath).size;

    const resData = resJSON({
      data: {
        size: formatSize(size),
        quality: sizeAudio[quality],
        format,
        link: `${STORAGE_URL}/audio/${filename}`,
      },
    });

    return c.json(resData, resData.status as 200);
  }

  const cookiePath = getLatestCookiePath('tiktok');

  const args = [
    YTDLP_PATH,
    '-x',
    '--no-playlist',
    '--audio-quality',
    quality,
    '--audio-format',
    format,
    '--ffmpeg-location',
    FFMPEG_PATH,
  ];

  if (cookiePath) {
    args.push('--cookies', cookiePath);
  }

  args.push('-o', filepath, url);

  const proc = Bun.spawn(args, {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const exit = await proc.exited;
  if (exit !== 0) {
    const stderr = await new Response(proc.stderr).text();
    logger.error(stderr);

    throw new HTTPException(400, {
      message: `Download failed with code ${exit}, ${stderr}`,
    });
  }

  const size: number = fs.statSync(filepath).size;

  const resData = resJSON({
    data: {
      size: formatSize(size),
      quality: sizeAudio[quality],
      format,
      link: `${STORAGE_URL}/audio/${filename}`,
    },
  });

  return c.json(resData, resData.status as 200);
}

export async function DownloadVideoQueueTikTok(c: Context) {
  const query = c.req.query();
  const request: VideoTypes = TiktokValidation.VIDEO.parse(query);

  const isAvailable = await checkTikTokVideo(request?.url);

  if (!isAvailable) {
    throw new HTTPException(400, {
      message: 'Video not available',
    });
  }

  const { url, format } = request;

  const ttID = getTikTokID(url) || url;
  const hash = createHash('md5')
    .update(`tt-video-${ttID}-${format}`)
    .digest('hex');
  const filename = `${hash}.${format}`;
  const filepath = path.join(VIDEO_DIR, filename);

  if (fs.existsSync(filepath)) {
    const size: number = fs.statSync(filepath).size;

    const resData = resJSON({
      data: {
        size: formatSize(size),
        format,
        link: `${STORAGE_URL}/video/${filename}`,
      },
    });

    return c.json(resData, resData.status as 200);
  }

  if (!cache.has(filename)) {
    cache.set(
      filename,
      {
        url,
        format,
        site: 'tiktok',
      },
      7200
    ); // 2 hours
  }

  const resData = resJSON({
    statusCode: 202,
    message: 'Video is being processed. Please try again shortly.',
  });

  return c.json(resData, resData.status as 202);
}

export async function DownloadAudioQueueTikTok(c: Context) {
  const query = c.req.query();
  const request: AudioTypes = TiktokValidation.AUDIO.parse(query);

  const isAvailable = await checkTikTokVideo(request?.url);

  if (!isAvailable) {
    throw new HTTPException(400, {
      message: 'Video not available',
    });
  }

  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  const { url, quality, format } = request;

  const ttID = getTikTokID(url) || url;
  const hash = createHash('md5')
    .update(`tt-audio-${ttID}-${quality}-${format}`)
    .digest('hex');
  const filename = `${hash}.${format}`;
  const filepath = path.join(AUDIO_DIR, filename);

  const sizeAudio = {
    '0': '0 => 320kbps',
    '5': '5 => 160kbps',
    '9': '9 => 64kbps',
  };

  if (fs.existsSync(filepath)) {
    const size: number = fs.statSync(filepath).size;

    const resData = resJSON({
      data: {
        size: formatSize(size),
        quality: sizeAudio[quality],
        format,
        link: `${STORAGE_URL}/audio/${filename}`,
      },
    });

    return c.json(resData, resData.status as 200);
  }

  if (!cache.has(filename)) {
    cache.set(
      filename,
      {
        url,
        quality,
        format,
        site: 'tiktok',
      },
      7200
    ); // 2 hours
  }

  const resData = resJSON({
    statusCode: 202,
    message: 'Audio is being processed. Please try again shortly.',
  });

  return c.json(resData, resData.status as 202);
}
