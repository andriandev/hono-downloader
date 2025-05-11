import { describe, it, expect } from 'bun:test';
import { app } from '../index';

const TT_URL = 'https://www.tiktok.com/@ms92000/video/7494996321254903095';

describe('GET /video', () => {
  it('should return download link and data for valid TikTok URL and format', async () => {
    const res = await app.request(`/video?url=${TT_URL}&format=mp4`);

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.link).toContain('/video/');
    expect(data.data.size).toBeDefined();
  });

  it('should fail if TikTok video is not available', async () => {
    const res = await app.request(
      '/video?url=https://www.tiktok.com/@ms92000/video/not-exist'
    );

    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message).toBe('Video not available');
  });

  it('should return 400 for invalid format', async () => {
    const res = await app.request(`/video?url=${TT_URL}&format=exe`);

    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message?.format).toBe('Format must be either mp4 or mkv');
  });

  it('should return 400 for invalid TikTok URL', async () => {
    const res = await app.request('/video?url=https://example.com&format=mp4');

    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message?.url).toBe(
      'Only TikTok, Facebook and InstaGram URLs are allowed'
    );
  });
});

describe('GET /audio', () => {
  it('should return audio download link and data for valid TikTok URL and format', async () => {
    const res = await app.request(`/audio?url=${TT_URL}&quality=5&format=mp3`);

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.link).toContain('/audio/');
    expect(data.data.size).toBeDefined();
  });

  it('should fail if TikTok video is not available', async () => {
    const res = await app.request(
      '/audio?url=https://www.tiktok.com/@ms92000/video/not-exist'
    );

    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message).toBe('Video not available');
  });

  it('should return 400 for invalid format', async () => {
    const res = await app.request(`/audio?url=${TT_URL}&quality=0&format=exe`);

    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message?.format).toBe(
      'Format must be one of mp3, m4a, flac, opus'
    );
  });

  it('should return 400 for invalid TikTok URL', async () => {
    const res = await app.request(
      '/audio?url=https://example.com&quality=0&format=mp3'
    );

    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message?.url).toBe(
      'Only TikTok, Facebook and InstaGram URLs are allowed'
    );
  });
});

describe('GET /video-queue', () => {
  it('should return 200 and video link if file already exists', async () => {
    const res = await app.request(`/video-queue?url=${TT_URL}&format=mp4`);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.link).toContain('/video/');
    expect(data.data.size).toBeDefined();
    expect(data.data.format).toBe('mp4');
  });

  it('should fail if TikTok video is not available', async () => {
    const res = await app.request(
      '/video-queue?url=https://www.tiktok.com/@ms92000/video/not-exist'
    );

    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message).toBe('Video not available');
  });

  it('should return 202 and enqueue video if not exists', async () => {
    const dummyUrl =
      'https://www.tiktok.com/@ms92000/video/7493453729094536453';
    const res = await app.request(`/video-queue?url=${dummyUrl}&format=mp4`);

    const data = await res.json();

    expect(res.status).toBe(202);
    expect(data.message).toBe(
      'Video is being processed. Please try again shortly.'
    );
  });
});

describe('GET /audio-queue', () => {
  it('should return 200 and audio link if file already exists', async () => {
    const res = await app.request(
      `/audio-queue?url=${TT_URL}&quality=5&format=mp3`
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.link).toContain('/audio/');
    expect(data.data.size).toBeDefined();
    expect(data.data.quality).toBe('5 => 160kbps');
    expect(data.data.format).toBe('mp3');
  });

  it('should fail if TikTok video is not available', async () => {
    const res = await app.request(
      '/audio-queue?url=https://www.tiktok.com/@ms92000/video/not-exist'
    );

    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message).toBe('Video not available');
  });

  it('should return 202 and enqueue audio if not exists', async () => {
    const dummyUrl =
      'https://www.tiktok.com/@ms92000/video/7493453729094536453';
    const res = await app.request(
      `/audio-queue?url=${dummyUrl}&quality=9&format=mp3`
    );
    const data = await res.json();

    expect(res.status).toBe(202);
    expect(data.message).toBe(
      'Audio is being processed. Please try again shortly.'
    );
  });
});
