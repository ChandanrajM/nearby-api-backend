import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService }  from '../cache/cache.service';

@Injectable()
export class ThemesService {
  private readonly logger = new Logger(ThemesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache:  CacheService,
  ) {}

  // ── GET ALL THEMES ────────────────────────────────────────
  // Android theme picker loads this — shows all available themes
  async findAll() {
    const cacheKey = 'themes:all';
    const cached   = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const themes = await this.prisma.theme.findMany({
      where:   { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const result = themes.map(this.formatTheme);

    // Themes rarely change — cache for 30 minutes
    await this.cache.set(cacheKey, result, 1800);
    return result;
  }

  // ── GET ONE THEME ─────────────────────────────────────────
  async findOne(themeId: string) {
    const theme = await this.prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      throw new NotFoundException(`Theme ${themeId} not found`);
    }

    return this.formatTheme(theme);
  }

  // ── GET DEFAULT THEME FOR CATEGORY ───────────────────────
  // KEY ENDPOINT — called when shopper selects a category
  // Returns the default theme config AND all available themes
  // so Android can render immediately + show "change theme" options
  async getThemeForCategory(categoryId: string) {
    const cacheKey = `themes:category:${categoryId}`;
    const cached   = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    // Fetch category
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }

    // Fetch all theme mappings for this category
    // ordered by: default first, then by sortOrder
    const mappings = await this.prisma.categoryTheme.findMany({
      where:   { categoryId },
      include: { theme: true },
      orderBy: [
        { isDefault:  'desc' },   // default theme comes first
        { sortOrder:  'asc'  },
      ],
    });

    if (mappings.length === 0) {
      // Fallback — if no mapping exists, return Grid theme
      this.logger.warn(
        `No theme mapping for category ${categoryId} — using Grid fallback`,
      );
      const fallback = await this.prisma.theme.findFirst({
        where: { name: 'Grid' },
      });
      if (!fallback) throw new NotFoundException('No themes available');

      return {
        category:       { id: category.id, name: category.name },
        defaultTheme:   this.formatTheme(fallback),
        availableThemes: [this.formatTheme(fallback)],
      };
    }

    const defaultMapping   = mappings.find(m => m.isDefault) ?? mappings[0];
    const availableThemes  = mappings.map(m => ({
      ...this.formatTheme(m.theme),
      isDefault: m.isDefault,
    }));

    const result = {
      category: {
        id:   category.id,
        name: category.name,
      },
      // This is what Android renders immediately on category tap
      defaultTheme: this.formatTheme(defaultMapping.theme),
      // These appear in the "Change Theme" bottom sheet
      availableThemes,
    };

    // Cache for 10 minutes
    await this.cache.set(cacheKey, result, 600);

    this.logger.log(
      `Theme for category "${category.name}": ` +
      `default=${defaultMapping.theme.name}`,
    );

    return result;
  }

  // ── GET THEMES WITH CATEGORY DEFAULTS ─────────────────────
  // Returns all themes showing which categories they're default for
  // Useful for the theme store screen like in your screenshots
  async findAllWithCategoryInfo() {
    const cacheKey = 'themes:all:with-categories';
    const cached   = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    const themes = await this.prisma.theme.findMany({
      where:   { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        categoryThemes: {
          where:   { isDefault: true },
          include: { category: { select: { id: true, name: true } } },
        },
      },
    });

    const result = themes.map(theme => ({
      ...this.formatTheme(theme),
      defaultForCategories: theme.categoryThemes.map(ct => ({
        id:   ct.category.id,
        name: ct.category.name,
      })),
    }));

    await this.cache.set(cacheKey, result, 1800);
    return result;
  }

  // ── FORMAT HELPER ─────────────────────────────────────────
  private formatTheme(theme: any) {
    return {
      id:                  theme.id,
      name:                theme.name,
      description:         theme.description,
      tagline:             theme.tagline,
      previewUrl:          theme.previewUrl,
      previewGradientFrom: theme.previewGradientFrom,
      previewGradientTo:   theme.previewGradientTo,
      configJson:          theme.configJson,
      sortOrder:           theme.sortOrder,
    };
  }
}
