import { prisma } from '../src/lib/prisma.js';

async function main() {
  const list = await prisma.announcement.findMany();
  console.log('ANNOUNCEMENTS IN DB:', JSON.stringify(list, null, 2));
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
