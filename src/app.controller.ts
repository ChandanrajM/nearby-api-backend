import { Controller, Get, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from './common/guards/firebase-auth.guard';
import { CurrentUser } from './common/decorators/current-user.decorator';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: 'Welcome to Nearby API 🚀',
      version: '1.0.0',
      docs: '/api/v1/health',
    };
  }

  // ── Public route — no auth needed ─────────────────────────
  @Get('health')
  health() {
    return {
      status: 'ok',
      app: 'Nearby API',
      timestamp: new Date().toISOString(),
    };
  }

  // ── Protected route — requires valid Firebase token ────────
  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: any) {
    return {
      message: 'Token is valid ✅',
      user,
    };
  }
}
