import type { ZodIssue } from 'zod';
import type { ResJSONTypes } from '@helpers/types';

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
    const res = await fetch(api);
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
