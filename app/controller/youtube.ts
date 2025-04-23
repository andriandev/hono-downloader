import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { YoutubeValidation } from '@app/validation/youtube';
import { resJSON, getYouTubeID } from '@app/helpers/function';
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

export async function InfoVideo(c: Context) {
  const query: InfoTypes = {
    url: c.req.query('url'),
  };

  const request: InfoTypes = YoutubeValidation.INFO.parse(query);

  const proc = Bun.spawnSync([YTDLP_PATH, '--dump-json', request.url], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  if (proc.exitCode !== 0) {
    throw new HTTPException(400, {
      message: new TextDecoder().decode(proc.stderr),
    });
  }

  const output = new TextDecoder().decode(proc.stdout);
  const data = JSON.parse(output);
  const formats = data.formats || [];

  const audioFormats = formats
    .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none' && f.url)
    .map((f: any) => ({
      format_id: f.format_id,
      ext: f.ext,
      acodec: f.acodec,
      abr: f.abr,
      filesize: f.filesize,
      url: f.url,
    }));

  const videoFormats = formats
    .filter((f: any) => f.vcodec !== 'none' && f.url)
    .map((f: any) => ({
      format_id: f.format_id,
      ext: f.ext,
      resolution: `${f.height}p`,
      fps: f.fps,
      vcodec: f.vcodec,
      acodec: f.acodec,
      filesize: f.filesize,
      url: f.url,
    }));

  const resData = resJSON({
    data: {
      title: data.title,
      duration: data.duration,
      thumbnail: data.thumbnail,
      audio: audioFormats,
      video: videoFormats,
    },
  });

  return c.json(resData, resData.status as 200);
}

export async function DownloadVideo(c: Context) {
  const query = c.req.query();
  const request: VideoTypes = YoutubeValidation.VIDEO.parse(query);

  if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });

  const { url, quality, format } = request;

  const formatMap: Record<string, string> = {
    '1080p': 'bestvideo[height<=1080]+bestaudio',
    '720p': 'bestvideo[height<=720]+bestaudio',
    '480p': 'bestvideo[height<=480]+bestaudio',
    '360p': 'bestvideo[height<=360]+bestaudio',
  };

  const selectedFormat = formatMap[quality];

  const ytID = getYouTubeID(url) || url;
  const hash = createHash('md5')
    .update(`video-${ytID}-${quality}-${format}`)
    .digest('hex');
  const filename = `${hash}.${format}`;
  const filepath = path.join(VIDEO_DIR, filename);

  if (fs.existsSync(filepath)) {
    const size = fs.statSync(filepath).size;

    const resData = resJSON({
      data: {
        size,
        quality,
        format,
        link: `${STORAGE_URL}/video/${filename}`,
      },
    });

    return c.json(resData, resData.status as 200);
  }

  const args = [
    YTDLP_PATH,
    '-f',
    selectedFormat,
    '--merge-output-format',
    format,
    '--ffmpeg-location',
    FFMPEG_PATH,
    '-o',
    filepath,
    url,
  ];

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

  const size = fs.statSync(filepath).size;

  const resData = resJSON({
    data: {
      size,
      quality,
      format,
      link: `${STORAGE_URL}/video/${filename}`,
    },
  });

  return c.json(resData, resData.status as 200);
}

export async function DownloadAudio(c: Context) {
  const query = c.req.query();
  const request: AudioTypes = YoutubeValidation.AUDIO.parse(query);

  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  const { url, quality, format } = request;

  const ytID = getYouTubeID(url) || url;
  const hash = createHash('md5')
    .update(`audio-${ytID}-${quality}-${format}`)
    .digest('hex');
  const filename = `${hash}.${format}`;
  const filepath = path.join(AUDIO_DIR, filename);

  const sizeAudio = {
    '0': '0 => 320kbps',
    '5': '5 => 160kbps',
    '9': '9 => 64kbps',
  };

  if (fs.existsSync(filepath)) {
    const size = fs.statSync(filepath).size;

    const resData = resJSON({
      data: {
        size,
        quality: sizeAudio[quality],
        format,
        link: `${STORAGE_URL}/audio/${filename}`,
      },
    });

    return c.json(resData, resData.status as 200);
  }

  const args = [
    YTDLP_PATH,
    '-x',
    '--audio-quality',
    quality,
    '--audio-format',
    format,
    '--ffmpeg-location',
    FFMPEG_PATH,
    '-o',
    filepath,
    url,
  ];

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

  const size = fs.statSync(filepath).size;

  const resData = resJSON({
    data: {
      size,
      quality: sizeAudio[quality],
      format,
      link: `${STORAGE_URL}/audio/${filename}`,
    },
  });

  return c.json(resData, resData.status as 200);
}

export async function DownloadVideoQueue(c: Context) {
  const query = c.req.query();
  const request: VideoTypes = YoutubeValidation.VIDEO.parse(query);

  const { url, quality, format } = request;

  const ytID = getYouTubeID(url) || url;
  const hash = createHash('md5')
    .update(`video-${ytID}-${quality}-${format}`)
    .digest('hex');
  const filename = `${hash}.${format}`;
  const filepath = path.join(VIDEO_DIR, filename);

  if (fs.existsSync(filepath)) {
    const size = fs.statSync(filepath).size;

    const resData = resJSON({
      data: {
        size,
        quality,
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
        url: url,
        quality,
        format,
      },
      600
    ); // 10 minutes
  }

  const resData = resJSON({
    statusCode: 202,
    message: 'Video is being processed. Please try again shortly.',
  });

  return c.json(resData, resData.status as 202);
}

export async function DownloadAudioQueue(c: Context) {
  const query = c.req.query();
  const request: AudioTypes = YoutubeValidation.AUDIO.parse(query);

  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  const { url, quality, format } = request;

  const ytID = getYouTubeID(url) || url;
  const hash = createHash('md5')
    .update(`audio-${ytID}-${quality}-${format}`)
    .digest('hex');
  const filename = `${hash}.${format}`;
  const filepath = path.join(AUDIO_DIR, filename);

  const sizeAudio = {
    '0': '0 => 320kbps',
    '5': '5 => 160kbps',
    '9': '9 => 64kbps',
  };

  if (fs.existsSync(filepath)) {
    const size = fs.statSync(filepath).size;

    const resData = resJSON({
      data: {
        size,
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
        url: url,
        quality,
        format,
      },
      600
    ); // 10 minutes
  }

  const resData = resJSON({
    statusCode: 202,
    message: 'Audio is being processed. Please try again shortly.',
  });

  return c.json(resData, resData.status as 202);
}
