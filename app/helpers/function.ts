import fs from 'fs';
import path from 'path';
import type { ZodIssue } from 'zod';
import type { ResJSONTypes } from '@helpers/types';

const fetchOptions = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
  },
};

export function resJSON<T = any>({
  statusCode = 200,
  data,
  ...props
}: ResJSONTypes<T>): ResJSONTypes<T> {
  return {
    status: statusCode,
    ...props,
    ...(data !== undefined ? { data } : {}),
  };
}

export function formatZodErrors(errors: ZodIssue[]): Record<string, string> {
  const result: Record<string, string> = {};

  errors.forEach((error) => {
    const field = String(error.path[0]);
    result[field] = error.message;
  });

  return result;
}

export function getYouTubeID(url: string) {
  const regex =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export async function checkYouTubeVideo(url: string) {
  try {
    const api = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      url
    )}&format=json`;
    const res = await fetch(api, fetchOptions);
    if (!res.ok) return null;

    const data = await res.json();
    return {
      title: data.title,
      thumbnail_url: data.thumbnail_url,
    };
  } catch {
    return null;
  }
}

export function getTikTokID(url: string): string | null {
  const match = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
  return match ? match[1] : null;
}

export async function checkTikTokVideo(url: string) {
  try {
    const api = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(api, fetchOptions);
    if (!res.ok) return null;

    const data = await res.json();
    return {
      title: data.title,
      thumbnail_url: data.thumbnail_url,
    };
  } catch {
    return null;
  }
}

export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function getLatestCookiePath(site: string): string | null {
  const tempDir = path.join(process.cwd(), 'temp');
  const cookiePrefix = `cookies_${site}_`;

  if (!fs.existsSync(tempDir)) return null;

  const cookieFiles = fs
    .readdirSync(tempDir)
    .filter((name) => name.startsWith(cookiePrefix) && name.endsWith('.txt'))
    .map((name) => {
      const timestampStr = name.replace(cookiePrefix, '').replace('.txt', '');
      const timestamp = parseInt(timestampStr, 10);
      return { name, timestamp };
    })
    .filter((file) => !isNaN(file.timestamp))
    .sort((a, b) => b.timestamp - a.timestamp);

  const latestCookieFile = cookieFiles[0]?.name;
  return latestCookieFile ? path.join(tempDir, latestCookieFile) : null;
}
