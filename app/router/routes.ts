import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import {
  InfoVideoYouTube,
  DownloadVideoYouTube,
  DownloadAudioYouTube,
  DownloadVideoQueueYouTube,
  DownloadAudioQueueYouTube,
} from '@app/controller/youtube';
import {
  InfoVideoTikTok,
  DownloadVideoTikTok,
  DownloadAudioTikTok,
  DownloadVideoQueueTikTok,
  DownloadAudioQueueTikTok,
} from '@app/controller/tiktok';
import { UploadCookies, ClearCookies } from '@app/controller/cookies';
import { FlushCache } from '@app/controller/cache';

const app = new Hono();

app.use('/favicon.ico', serveStatic({ path: './favicon.ico' }));

if (process.env.APP_SERVER_STATIC == 'enable') {
  app.use('/audio/*', serveStatic({ root: './public' }));
  app.use('/video/*', serveStatic({ root: './public' }));
}

app.get('/cache/flush', FlushCache);

app.get('/yt/info', InfoVideoYouTube);
app.get('/yt/video', DownloadVideoYouTube);
app.get('/yt/audio', DownloadAudioYouTube);
app.get('/yt/video-queue', DownloadVideoQueueYouTube);
app.get('/yt/audio-queue', DownloadAudioQueueYouTube);

app.get('/tt/info', InfoVideoTikTok);
app.get('/tt/video', DownloadVideoTikTok);
app.get('/tt/audio', DownloadAudioTikTok);
app.get('/tt/video-queue', DownloadVideoQueueTikTok);
app.get('/tt/audio-queue', DownloadAudioQueueTikTok);

app.post('/cookies', UploadCookies);
app.delete('/cookies', ClearCookies);

export default app;
