import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import {
  InfoVideo,
  DownloadVideo,
  DownloadAudio,
  DownloadVideoQueue,
  DownloadAudioQueue,
} from '@app/controller/youtube';
import { FlushCache } from '@app/controller/cache';

const app = new Hono();

app.use('/favicon.ico', serveStatic({ path: './favicon.ico' }));

if (process.env.APP_SERVER_STATIC == 'enable') {
  app.use('/audio/*', serveStatic({ root: './public' }));
  app.use('/video/*', serveStatic({ root: './public' }));
}

app.get('/cache/flush', FlushCache);

app.get('/yt/info', InfoVideo);
app.get('/yt/video', DownloadVideo);
app.get('/yt/audio', DownloadAudio);
app.get('/yt/video-queue', DownloadVideoQueue);
app.get('/yt/audio-queue', DownloadAudioQueue);

export default app;
