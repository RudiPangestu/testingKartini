import { PrismaClient, ViolationLevel } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Seed katalog jenis pelanggaran (tata tertib) dari file JSON hasil ekstraksi
// "Poin Tata Tertib SMA Kartini". Idempoten: item yang sudah ada (level+nama)
// dilewati, sehingga tidak menimpa perubahan yang dibuat admin.
const prisma = new PrismaClient();

interface CatalogItem {
  level: ViolationLevel;
  category: string;
  name: string;
  points: number;
}

async function main() {
  const file = path.join(__dirname, 'violations-catalog.json');
  const items = JSON.parse(fs.readFileSync(file, 'utf8')) as CatalogItem[];

  let created = 0;
  let skipped = 0;
  for (const it of items) {
    const existing = await prisma.violationType.findFirst({
      where: { name: it.name, level: it.level },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.violationType.create({
      data: {
        level: it.level,
        category: it.category,
        name: it.name,
        points: it.points,
      },
    });
    created++;
  }
  console.log(
    `Seed katalog pelanggaran: ${created} dibuat, ${skipped} dilewati (total ${items.length}).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
