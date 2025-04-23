export const APP_NODE = process.env.APP_ENV || 'development';
export const APP_TIMEOUT = +process.env.APP_TIMEOUT || 60; // 60 seconds
export const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3001';
export const STORAGE_URL = process.env.APP_STORAGE_URL || '';
export const AUDIO_DIR = process.env.APP_AUDIO_DIR || './public/audio';
export const VIDEO_DIR = process.env.APP_VIDEO_DIR || './public/video';
export const JOB_INTERVAL =
  +process.env.APP_JOB_INTERVAL || 2 * 24 * 60 * 60 * 1000; // 2 days
export const FILE_EXPIRED = +process.env.APP_FILE_EXPIRED || 6 * 60 * 60 * 1000; // 6 hours
export const YTDLP_PATH =
  process.env.APP_YTDLP_PATH || 'D:\\Data\\App\\yt-dlp\\yt-dlp.exe';
export const FFMPEG_PATH =
  process.env.APP_FFMPEG_PATH || 'D:\\Data\\App\\ffmpeg\\bin';
