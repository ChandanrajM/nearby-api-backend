import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { name: 'Shoes',       slug: 'shoes',       iconUrl: null },
  { name: 'Food',        slug: 'food',        iconUrl: null },
  { name: 'Electronics', slug: 'electronics', iconUrl: null },
  { name: 'Clothing',    slug: 'clothing',    iconUrl: null },
  { name: 'Books',       slug: 'books',       iconUrl: null },
  { name: 'Furniture',   slug: 'furniture',   iconUrl: null },
  { name: 'Beauty',      slug: 'beauty',      iconUrl: null },
  { name: 'Sports',      slug: 'sports',      iconUrl: null },
];

const THEMES = [
  {
    name:        'Grid',
    configJson:  {
      layout:      'grid',
      cols:        2,
      imageRatio:  '1:1',
      cardStyle:   'rounded',
    },
  },
  {
    name:        'Reels',
    configJson:  {
      layout:      'reels',
      imageRatio:  '9:16',
      showOverlay: true,
    },
  },
  {
    name:        'Minimal',
    configJson:  {
      layout:        'minimal',
      imageRatio:    '1:1',
      thumbnailSize: 'small',
    },
  },
  {
    name:        'Cards',
    configJson:  {
      layout:     'cards',
      imageRatio: '4:3',
      showBadge:  true,
    },
  },
];

async function main() {
  console.log('🌱 Starting database seed...\\n');

  console.log('📦 Seeding categories...');
  for (const cat of CATEGORIES) {
    const result = await prisma.category.upsert({
      where:  { name: cat.name },
      update: { iconUrl: cat.iconUrl, slug: cat.slug },
      create: {
        name:    cat.name,
        slug:    cat.slug,
        iconUrl: cat.iconUrl,
      },
    });
    console.log(`   ✅ ${result.name} (${result.id})`);
  }

  console.log('\\n🎨 Seeding themes...');
  for (const theme of THEMES) {
    const result = await prisma.theme.upsert({
      where:  { name: theme.name },
      update: {
        configJson:  theme.configJson,
      },
      create: {
        name:        theme.name,
        configJson:  theme.configJson,
        isActive:    true,
      },
    });
    console.log(`   ✅ ${result.name} — layout: ${(result.configJson as any).layout}`);
  }

  const categoryCount = await prisma.category.count();
  const themeCount    = await prisma.theme.count();

  console.log('\n─────────────────────────────────────');
  console.log(`✅ Seed complete`);
  console.log(`   Categories : ${categoryCount}`);
  console.log(`   Themes     : ${themeCount}`);
  console.log('─────────────────────────────────────\n');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
