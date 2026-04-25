import {
  Controller, Get,
  ForbiddenException,
} from '@nestjs/common';
import { Public }       from './common/decorators/public.decorator';
import { Roles }        from './common/decorators/roles.decorator';
import { CurrentUser }  from './common/decorators/current-user.decorator';
import { Role }         from '@prisma/client';
import { User }         from '@prisma/client';

@Controller()
export class AppController {

  @Public()
  @Get('health')
  health() {
    return {
      status:    'ok',
      app:       'Nearby API',
      version:   '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('me')
  getMe(@CurrentUser() user: User) {
    return {
      message: 'Authenticated ✅',
      user,
    };
  }

  @Roles(Role.SELLER)
  @Get('owner-only')
  ownerOnly(@CurrentUser() user: User) {
    return {
      message: `Welcome store owner: ${user.name}`,
    };
  }
}
