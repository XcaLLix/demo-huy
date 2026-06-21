import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const YOUTUBE_IDS = [
  'rafj8K1gkDY',
  '1dCnNyNaaw8',
  'mbVICMRPLFw',
  'GruyutmWI0M',
  'Cfhvu3MYFio',
  'jbx9_G8u9lI',
  'T_ENQ4KaMFM',
  'yCPtqOxsgjE',
  '4-mzFLiwlkU',
  'L_qcnimTP2M',
  'MfjNZPMOj5Q',
  'CV5vDT51svE',
  'eF9HME2ZJ9o',
  'cF3RKQwii6w',
  '-QZMxi7YSJ8',
  '3oRXNsxk4ew',
  'mgy_-1uD910',
  'UL0LyL6YVMk',
  'CotrgHdPpvU',
  'uwcmSp-WsZY'
];

async function main() {
  console.log('[Script] Updating all lessons in database using fast raw query...');
  
  for (let idx = 0; idx < YOUTUBE_IDS.length; idx++) {
    const youtubeId = YOUTUBE_IDS[idx];
    const videoUrl = `https://www.youtube.com/embed/${youtubeId}`;
    
    // In PostgreSQL, execute raw update
    const count = await prisma.$executeRawUnsafe(
      `UPDATE "Lesson" SET "videoUrl" = $1 WHERE (id % ${YOUTUBE_IDS.length}) = $2`,
      videoUrl,
      idx
    );
    console.log(`[Script] Updated ${count} lessons for YouTube ID ${youtubeId}`);
  }

  console.log('[Script] Finished bulk updating all lesson videos successfully!');
}

main()
  .catch(err => {
    console.error('[Script] Error updating videos:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
