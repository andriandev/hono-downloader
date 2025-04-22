export const APP_NODE = process.env.APP_ENV || 'development';
export const APP_TIMEOUT = +process.env.APP_TIMEOUT || 60; // 60 seconds
export const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3001';
export const AUDIO_DIR = './public/audio';
export const VIDEO_DIR = './public/video';
export const JOB_INTERVAL =
  +process.env.APP_JOB_INTERVAL || 2 * 24 * 60 * 60 * 1000; // 2 days
export const FILE_EXPIRED = +process.env.APP_FILE_EXPIRED || 6 * 60 * 60 * 1000; // 6 hours
