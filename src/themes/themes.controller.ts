import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import { ThemesService } from './themes.service';
import { Public }        from '../common/decorators/public.decorator';

// All theme routes are PUBLIC
// Both shoppers and owners need theme data
@Public()
@Controller('themes')
export class ThemesController {
  constructor(private readonly themes: ThemesService) {}

  // ── GET /api/v1/themes ────────────────────────────────────
  // Returns all active themes — for the theme store screen
  @Get()
  findAll() {
    return this.themes.findAll();
  }

  // ── GET /api/v1/themes/with-categories ───────────────────
  // Returns themes with which categories they're default for
  // Powers the theme store screen in your screenshots
  @Get('with-categories')
  findAllWithCategories() {
    return this.themes.findAllWithCategoryInfo();
  }

  // ── GET /api/v1/themes/for-category/:categoryId ──────────
  // THE KEY ENDPOINT
  // Called when shopper taps a category on Home screen
  // Returns: defaultTheme (render immediately) + availableThemes
  // (show in "Change Theme" bottom sheet)
  @Get('for-category/:categoryId')
  getForCategory(
    @Param('categoryId') categoryId: string,
  ) {
    return this.themes.getThemeForCategory(categoryId);
  }

  // ── GET /api/v1/themes/:id ────────────────────────────────
  // Get a single theme config by ID
  // Called when user picks a different theme from the picker
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.themes.findOne(id);
  }
}
