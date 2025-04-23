import { describe, it, expect } from 'bun:test';
import { app } from '../index';

const YT_URL = 'https://www.youtube.com/watch?v=gbnlaoZP4e8';

describe('GET /yt/info', () => {
  it('should return video info for valid YouTube URL', async () => {
    const res = await app.request(`/yt/info?url=${YT_URL}`);

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.title).toBeDefined();
    expect(data.data.thumbnail).toContain('http');
    expect(Array.isArray(data.data.audio)).toBe(true);
    expect(Array.isArray(data.data.video)).toBe(true);
  });

  it('should return 400 for invalid YouTube URL', async () => {
    const res = await app.request('/yt/info?url=https://google.com');

    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message?.url).toBe('Only YouTube URLs are allowed');
  });
});

describe('GET /yt/video', () => {
  it('should return download link and data for valid YouTube URL and format', async () => {
    const res = await app.request(
      `/yt/video?url=${YT_URL}&quality=360p&format=mp4`
    );

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.link).toContain('/video/');
    expect(data.data.size).toBeGreaterThan(0);
  });

  it('should return 400 for invalid format', async () => {
    const res = await app.request(
      `/yt/video?url=${YT_URL}&quality=360p&format=exe`
    );

    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message?.format).toBe('Format must be either mp4 or mkv');
  });

  it('should return 400 for invalid YouTube URL', async () => {
    const res = await app.request(
      '/yt/video?url=https://example.com&quality=360p&format=mp4'
    );

    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message?.url).toBe('Only YouTube URLs are allowed');
  });
});

describe('GET /yt/audio', () => {
  it('should return audio download link and data for valid YouTube URL and format', async () => {
    const res = await app.request(
      `/yt/audio?url=${YT_URL}&quality=5&format=mp3`
    );

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.link).toContain('/audio/');
    expect(data.data.size).toBeGreaterThan(0);
  });

  it('should return 400 for invalid format', async () => {
    const res = await app.request(
      `/yt/audio?url=${YT_URL}&quality=0&format=exe`
    );

    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message?.format).toBe(
      'Format must be one of mp3, m4a, flac, opus'
    );
  });

  it('should return 400 for invalid YouTube URL', async () => {
    const res = await app.request(
      '/yt/audio?url=https://example.com&quality=0&format=mp3'
    );

    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.message?.url).toBe('Only YouTube URLs are allowed');
  });
});

describe('GET /yt/video-queue', () => {
  it('should return 200 and video link if file already exists', async () => {
    const res = await app.request(
      `/yt/video-queue?url=${YT_URL}&quality=360p&format=mp4`
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.link).toContain('/video/');
    expect(data.data.size).toBeGreaterThan(0);
    expect(data.data.quality).toBe('360p');
    expect(data.data.format).toBe('mp4');
  });

  it('should return 202 and enqueue video if not exists', async () => {
    const dummyUrl = 'https://www.youtube.com/watch?v=I05cWma0SY8';
    const res = await app.request(
      `/yt/video-queue?url=${dummyUrl}&quality=360p&format=mp4`
    );

    const data = await res.json();

    expect(res.status).toBe(202);
    expect(data.message).toBe(
      'Video is being processed. Please try again shortly.'
    );
  });
});

describe('GET /yt/audio-queue', () => {
  it('should return 200 and audio link if file already exists', async () => {
    const res = await app.request(
      `/yt/audio-queue?url=${YT_URL}&quality=5&format=mp3`
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.link).toContain('/audio/');
    expect(data.data.size).toBeGreaterThan(0);
    expect(data.data.quality).toBe('5 => 160kbps');
    expect(data.data.format).toBe('mp3');
  });

  it('should return 202 and enqueue audio if not exists', async () => {
    const dummyUrl = 'https://www.youtube.com/watch?v=I05cWma0SY8';
    const res = await app.request(
      `/yt/audio-queue?url=${dummyUrl}&quality=9&format=mp3`
    );
    const data = await res.json();

    expect(res.status).toBe(202);
    expect(data.message).toBe(
      'Audio is being processed. Please try again shortly.'
    );
  });
});
