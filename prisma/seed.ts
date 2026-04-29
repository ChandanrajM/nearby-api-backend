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
  {
    name: 'Reels',
    description: 'Full-screen swipeable product cards',
    tagline: 'For visual discovery',
    sortOrder: 2,
    previewGradientFrom: '#EC4899',
    previewGradientTo: '#8B5CF6',
    configJson: {
      layout: 'reels',
      imageRatio: '9:16',
      showOverlay: true,
      overlayGradient: true,
      showPrice: true,
      showStoreName: true,
      showDistance: true,
      showBadge: false,
      accentColor: '#EC4899',
      overlayColor: '#00000080',
      textColor: '#FFFFFF',
      priceColor: '#FFFFFF',
    },
  },
  {
    name: 'Minimal',
    description: 'Clean list layout with small thumbnails',
    tagline: 'For quick browsing',
    sortOrder: 3,
    previewGradientFrom: '#6366F1',
    previewGradientTo: '#8B5CF6',
    configJson: {
      layout: 'minimal',
      imageRatio: '1:1',
      thumbnailSize: 'small',
      thumbnailWidth: 80,
      showPrice: true,
      showStoreName: true,
      showDistance: true,
      showDivider: true,
      backgroundColor: '#FFFFFF',
      cardBackground: '#FFFFFF',
      accentColor: '#6366F1',
      textColor: '#111827',
      priceColor: '#6366F1',
      secondaryText: '#6B7280',
    },
  },
  {
    name: 'Cards',
    description: 'Wide cards with featured banner',
    tagline: 'For deal discovery',
    sortOrder: 4,
    previewGradientFrom: '#10B981',
    previewGradientTo: '#059669',
    configJson: {
      layout: 'cards',
      imageRatio: '4:3',
      showBadge: true,
      showFeaturedBanner: true,
      featuredCount: 3,
      showPrice: true,
      showStoreName: true,
      showDistance: true,
      showDiscount: false,
      backgroundColor: '#F3F4F6',
      cardBackground: '#FFFFFF',
      accentColor: '#10B981',
      textColor: '#111827',
      priceColor: '#10B981',
      badgeColor: '#EF4444',
    },
  },
  {
    name: 'Mystic',
    description: 'Category-first grid with banner',
    tagline: 'For grocery or supermarket',
    sortOrder: 5,
    previewGradientFrom: '#065F46',
    previewGradientTo: '#34D399',
    configJson: {
      layout: 'mystic',
      imageRatio: '1:1',
      showCategoryBar: true,
      showSearchBar: true,
      showFeaturedBanner: true,
      cols: 3,
      showPrice: true,
      showAddButton: true,
      showStoreName: false,
      showDistance: true,
      backgroundColor: '#F0FDF4',
      cardBackground: '#FFFFFF',
      accentColor: '#10B981',
      headerColor: '#065F46',
      textColor: '#111827',
      priceColor: '#065F46',
    },
  },
  {
    name: 'Volt',
    description: 'Dark grid for tech products',
    tagline: 'For gadgets and electronics stores',
    sortOrder: 6,
    previewGradientFrom: '#1E1B4B',
    previewGradientTo: '#7C3AED',
    configJson: {
      layout: 'volt',
      imageRatio: '1:1',
      cols: 2,
      darkMode: true,
      showSpecBadge: true,
      showPrice: true,
      showDiscount: true,
      showStoreName: true,
      showDistance: true,
      backgroundColor: '#0F0F1A',
      cardBackground: '#1A1A2E',
      accentColor: '#7C3AED',
      textColor: '#F9FAFB',
      priceColor: '#A78BFA',
      secondaryText: '#9CA3AF',
    },
  },
  {
    name: 'Elegant',
    description: 'Spacious layout with large images',
    tagline: 'For furniture and decor stores',
    sortOrder: 7,
    previewGradientFrom: '#DB2777',
    previewGradientTo: '#F9A8D4',
    configJson: {
      layout: 'elegant',
      imageRatio: '4:3',
      cols: 2,
      showPrice: true,
      showOriginalPrice: true,
      showDiscount: true,
      showStoreName: true,
      showDistance: true,
      showSearchBar: true,
      backgroundColor: '#FFF7F7',
      cardBackground: '#FFFFFF',
      accentColor: '#DB2777',
      textColor: '#1F2937',
      priceColor: '#DB2777',
      discountColor: '#EF4444',
    },
  },
  {
    name: 'Prime',
    description: 'Banner-first with horizontal category scroll',
    tagline: 'For meat, fish and fresh produce',
    sortOrder: 8,
    previewGradientFrom: '#7F1D1D',
    previewGradientTo: '#EF4444',
    configJson: {
      layout: 'prime',
      imageRatio: '3:2',
      showFeaturedBanner: true,
      showCategoryScroll: true,
      showBestsellersRow: true,
      showPrice: true,
      showAddButton: true,
      showStoreName: true,
      showDistance: true,
      backgroundColor: '#FFF5F5',
      cardBackground: '#FFFFFF',
      accentColor: '#EF4444',
      headerColor: '#7F1D1D',
      textColor: '#1F2937',
      priceColor: '#EF4444',
    },
  },
];

// ── CATEGORIES with default theme assignment ───────────────
const CATEGORIES_WITH_THEMES = [
  {
    name: 'Food',
    defaultTheme: 'Mystic',
    otherThemes: ['Grid', 'Cards', 'Prime'],
  },
  {
    name: 'Electronics',
    defaultTheme: 'Volt',
    otherThemes: ['Grid', 'Minimal', 'Cards'],
  },
  {
    name: 'Clothing',
    defaultTheme: 'Reels',
    otherThemes: ['Grid', 'Minimal', 'Elegant'],
  },
  {
    name: 'Shoes',
    defaultTheme: 'Grid',
    otherThemes: ['Cards', 'Minimal', 'Reels'],
  },
  {
    name: 'Furniture',
    defaultTheme: 'Elegant',
    otherThemes: ['Grid', 'Minimal', 'Cards'],
  },
  {
    name: 'Beauty',
    defaultTheme: 'Reels',
    otherThemes: ['Grid', 'Elegant', 'Minimal'],
  },
  {
    name: 'Books',
    defaultTheme: 'Minimal',
    otherThemes: ['Grid', 'Cards'],
  },
  {
    name: 'Sports',
    defaultTheme: 'Cards',
    otherThemes: ['Grid', 'Volt', 'Minimal'],
  },
];

async function main() {
  console.log('🌱 Starting seed...\n');

  // 1. Seed themes
  console.log('🎨 Seeding themes...');
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
