import fs from 'fs';
import path from 'path';
import {
  AUDIO_DIR,
  VIDEO_DIR,
  JOB_INTERVAL,
  FILE_EXPIRED,
} from '@app/config/setting';
import { logger } from '@app/config/logging';
import { APP_NODE } from '@app/config/setting';

export function startCronJob() {
  const deleteOldFiles = (dir: string) => {
    APP_NODE !== 'production' ? logger.info(`Job running...`) : '';
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
          logger.info(`Deleted ${filePath}`);
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
