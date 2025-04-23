import fs from 'fs';
import path from 'path';
import {
  AUDIO_DIR,
  VIDEO_DIR,
  JOB_INTERVAL,
  FILE_EXPIRED,
} from '@app/config/setting';
import { logger } from '@app/config/logging';

export function startCronJob() {
  const deleteOldFiles = (dir: string) => {
    console.log('Cron Job running...');
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        const createdTime = stat.birthtimeMs || stat.ctimeMs;
        const age = now - createdTime;

        if (age > FILE_EXPIRED) {
          fs.unlinkSync(filePath);
          console.log(`Deleted ${filePath}`);
        }
      } catch (err) {
        logger.error(`Failed to delete ${filePath}`, err?.message);
      }
    }
  };

  setInterval(() => {
    deleteOldFiles(AUDIO_DIR);
    deleteOldFiles(VIDEO_DIR);
  }, JOB_INTERVAL);
}
