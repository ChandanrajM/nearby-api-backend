import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Categories ──────────────────────────────────────────
  const categories = [
    { name: 'Shoes', slug: 'shoes' },
    { name: 'Food', slug: 'food' },
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Clothing', slug: 'clothing' },
    { name: 'Books', slug: 'books' },
    { name: 'Furniture', slug: 'furniture' },
    { name: 'Beauty', slug: 'beauty' },
    { name: 'Sports', slug: 'sports' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  // ── Themes ──────────────────────────────────────────────
  const themes = [
    {
      name: 'Grid',
      configJson: { layout: 'grid', cols: 2, imageRatio: '1:1', cardStyle: 'rounded' },
    },
    {
      name: 'Reels',
      configJson: { layout: 'reels', imageRatio: '9:16', showOverlay: true },
    },
    {
      name: 'Minimal',
      configJson: { layout: 'minimal', imageRatio: '1:1', thumbnailSize: 'small' },
    },
    {
      name: 'Cards',
      configJson: { layout: 'cards', imageRatio: '4:3', showBadge: true },
    },
  ];

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { name: theme.name },
      update: {},
      create: theme,
    });
  }
  
  console.log('✅ Categories and Themes seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
