import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { DefaultValidation } from '@app/validation/default';
import {
  resJSON,
  formatSize,
  getLatestCookiePath,
  getVideoID,
  checkVideo,
} from '@app/helpers/function';
import type { AudioTypes, VideoTypes } from '@app/validation/youtube';
import {
  AUDIO_DIR,
  VIDEO_DIR,
  STORAGE_URL,
  YTDLP_PATH,
  FFMPEG_PATH,
} from '@app/config/setting';
import { cache } from '@app/config/cache';
import { logger } from '@app/config/logging';

export async function DownloadVideoDefault(c: Context) {
  const query = c.req.query();
  const request: VideoTypes = DefaultValidation.VIDEO.parse(query);

  const isAvailable = await checkVideo(request.url);

  if (!isAvailable) {
    throw new HTTPException(400, {
      message: 'Video not available',
    });
  }

  if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });

  const { url, format } = request;

  const videoID = getVideoID(url);
  const hash = createHash('md5')
    .update(`${videoID.alias}-video-${videoID.id}-${format}`)
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

  const cookiePath = getLatestCookiePath(videoID.site);

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

export async function DownloadAudioDefault(c: Context) {
  const query = c.req.query();
  const request: AudioTypes = DefaultValidation.AUDIO.parse(query);

  const isAvailable = await checkVideo(request.url);

  if (!isAvailable) {
    throw new HTTPException(400, {
      message: 'Video not available',
    });
  }

  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  const { url, quality, format } = request;

  const videoID = getVideoID(url);
  const hash = createHash('md5')
    .update(`${videoID.alias}-audio-${videoID.id}-${format}`)
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

  const cookiePath = getLatestCookiePath(videoID.site);

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

export async function DownloadVideoQueueDefault(c: Context) {
  const query = c.req.query();
  const request: VideoTypes = DefaultValidation.VIDEO.parse(query);

  const isAvailable = await checkVideo(request.url);

  if (!isAvailable) {
    throw new HTTPException(400, {
      message: 'Video not available',
    });
  }

  const { url, format } = request;

  const videoID = getVideoID(url);
  const hash = createHash('md5')
    .update(`${videoID.alias}-video-${videoID.id}-${format}`)
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
        site: videoID.site,
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

export async function DownloadAudioQueueDefault(c: Context) {
  const query = c.req.query();
  const request: AudioTypes = DefaultValidation.AUDIO.parse(query);

  const isAvailable = await checkVideo(request.url);

  if (!isAvailable) {
    throw new HTTPException(400, {
      message: 'Video not available',
    });
  }

  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  const { url, quality, format } = request;

  const videoID = getVideoID(url);
  const hash = createHash('md5')
    .update(`${videoID.alias}-audio-${videoID.id}-${format}`)
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
        site: videoID.site,
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
