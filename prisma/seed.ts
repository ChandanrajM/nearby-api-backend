import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

// Re-evaluating file to clear IDE stale type caches!!!  

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── THEMES ────────────────────────────────────────────────
const THEMES = [
  {
    name: 'Grid',
    description: 'Classic 2-column product grid',
    tagline: 'For everyday shopping',
    sortOrder: 1,
    previewGradientFrom: '#F97316',
    previewGradientTo: '#FB923C',
    configJson: {
      layout: 'grid',
      cols: 2,
      imageRatio: '1:1',
      cardStyle: 'rounded',
      showPrice: true,
      showStoreName: true,
      showDistance: true,
      showRating: false,
      backgroundColor: '#FFFFFF',
      cardBackground: '#F9FAFB',
      accentColor: '#F97316',
      textColor: '#111827',
      priceColor: '#F97316',
    },
  },
];

// ── CATEGORIES with default theme assignment ───────────────
const CATEGORIES_WITH_THEMES = [
  { name: 'Food', defaultTheme: 'Grid', otherThemes: [] },
  { name: 'Electronics', defaultTheme: 'Grid', otherThemes: [] },
  { name: 'Clothing', defaultTheme: 'Grid', otherThemes: [] },
  { name: 'Shoes', defaultTheme: 'Grid', otherThemes: [] },
  { name: 'Furniture', defaultTheme: 'Grid', otherThemes: [] },
  { name: 'Beauty', defaultTheme: 'Grid', otherThemes: [] },
  { name: 'Books', defaultTheme: 'Grid', otherThemes: [] },
  { name: 'Sports', defaultTheme: 'Grid', otherThemes: [] },
  { name: 'Fashion', defaultTheme: 'Grid', otherThemes: [] },
];

async function main() {
  console.log('🌱 Starting seed...\n');

  // 1. Seed themes
  console.log('🎨 Cleaning up old themes...');
  await prisma.theme.deleteMany({
    where: { name: { not: 'Grid' } }
  });
  
  console.log('🎨 Seeding Grid theme...');
  const themeMap: Record<string, string> = {};

  for (const t of THEMES) {
    const theme = await prisma.theme.upsert({
      where: { name: t.name },
      update: {
        description: t.description,
        tagline: t.tagline,
        sortOrder: t.sortOrder,
        previewGradientFrom: t.previewGradientFrom,
        previewGradientTo: t.previewGradientTo,
        configJson: t.configJson as any,
      },
      create: {
        name: t.name,
        description: t.description,
        tagline: t.tagline,
        previewUrl: null,
        sortOrder: t.sortOrder,
        previewGradientFrom: t.previewGradientFrom,
        previewGradientTo: t.previewGradientTo,
        configJson: t.configJson as any,
        isActive: true,
      },
    });
    themeMap[t.name] = theme.id;
    console.log(`   ✅ ${theme.name}`);
  }

  // 2. Seed categories + wire up default themes
  console.log('\n📦 Seeding categories + theme mappings...');

  for (const cat of CATEGORIES_WITH_THEMES) {
    // Upsert category
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {
        slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
      },
      create: {
        name: cat.name,
        slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
      },
    });

    // Delete existing mappings for clean re-seed
    await prisma.categoryTheme.deleteMany({
      where: { categoryId: category.id },
    });

    // Create default theme mapping
    const defaultThemeId = themeMap[cat.defaultTheme];
    if (defaultThemeId) {
      await prisma.categoryTheme.create({
        data: {
          categoryId: category.id,
          themeId: defaultThemeId,
          isDefault: true,
          sortOrder: 0,
        },
      });
    }

    // Create other theme mappings
    let order = 1;
    for (const otherThemeName of cat.otherThemes) {
      const otherThemeId = themeMap[otherThemeName];
      if (otherThemeId) {
        await prisma.categoryTheme.create({
          data: {
            categoryId: category.id,
            themeId: otherThemeId,
            isDefault: false,
            sortOrder: order++,
          },
        });
      }
    }

    console.log(
      `   ✅ ${cat.name} → default: ${cat.defaultTheme} ` +
      `| also: ${cat.otherThemes.join(', ')}`,
    );
  }

  // 3. Seed Demo User
  console.log('\n👤 Seeding demo user...');
  const demoUser = await prisma.user.upsert({
    where: { firebaseUid: 'demo-user-id' },
    update: {},
    create: {
      firebaseUid: 'demo-user-id',
      name: 'Demo Seller',
      email: 'seller@nearby.app',
      role: 'SELLER',
    },
  });

  // 4. Seed Demo Store
  console.log('🏪 Seeding demo store...');
  const store = await prisma.store.upsert({
    where: { ownerId: demoUser.id },
    update: {},
    create: {
      name: 'Nearby Superstore',
      ownerId: demoUser.id,
      latitude: 12.9716,
      longitude: 77.5946,
      geohash: 'tdr16n', // MG Road, Bangalore
      addressLine: 'MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      phone: '+91 9876543210',
    },
  });

  // 5. Seed Demo Products
  console.log('🛍️ Seeding demo products...');
  
  const foodsCat = await prisma.category.findUnique({ where: { name: 'Food' } });
  const clothingCat = await prisma.category.findUnique({ where: { name: 'Clothing' } });
  
  // Create Fashion category if it doesn't exist
  const fashionCat = await prisma.category.upsert({
    where: { name: 'Fashion' },
    update: {},
    create: {
      name: 'Fashion',
      slug: 'fashion',
    },
  });

  const demoProducts = [
    // Foods
    {
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato sauce, mozzarella, and basil',
      price: 499.0,
      imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&q=80',
      categoryId: foodsCat?.id,
    },
    {
      name: 'Chicken Burger',
      description: 'Juicy chicken patty with lettuce, tomato and special sauce',
      price: 249.0,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
      categoryId: foodsCat?.id,
    },
    // Clothing
    {
      name: 'Classic White T-Shirt',
      description: '100% cotton premium white tee',
      price: 799.0,
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80',
      categoryId: clothingCat?.id,
    },
    {
      name: 'Blue Denim Jeans',
      description: 'Slim fit durable denim jeans',
      price: 1999.0,
      imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80',
      categoryId: clothingCat?.id,
    },
    // Fashion
    {
      name: 'Aviator Sunglasses',
      description: 'Classic gold-frame aviators with polarized lenses',
      price: 1499.0,
      imageUrl: 'https://images.unsplash.com/photo-1511499767390-a73350266627?w=500&q=80',
      categoryId: fashionCat.id,
    },
    {
      name: 'Leather Handbag',
      description: 'Premium brown leather handbag for women',
      price: 3499.0,
      imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&q=80',
      categoryId: fashionCat.id,
    },
  ];

  for (const p of demoProducts) {
    if (!p.categoryId) continue;
    
    // Check if product exists (by name and store)
    const existing = await prisma.product.findFirst({
      where: { name: p.name, storeId: store.id }
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          description: p.description,
          price: p.price,
          imageUrl: p.imageUrl,
          categoryId: p.categoryId,
        }
      });
    } else {
      await prisma.product.create({
        data: {
          name: p.name,
          description: p.description,
          price: p.price,
          imageUrl: p.imageUrl,
          imageKey: `demo/${p.name.toLowerCase().replace(/\s+/g, '-')}`,
          categoryId: p.categoryId,
          storeId: store.id,
        },
      });
    }
    console.log(`   ✅ ${p.name}`);
  }

  // 6. Summary
  const themeCount = await prisma.theme.count();
  const categoryCount = await prisma.category.count();
  const productCount = await prisma.product.count();

  console.log('\n─────────────────────────────────────────');
  console.log('✅ Seed complete');
  console.log(`   Themes     : ${themeCount}`);
  console.log(`   Categories : ${categoryCount}`);
  console.log(`   Products   : ${productCount}`);
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch(err => { console.error('❌ Seed failed:', err); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
