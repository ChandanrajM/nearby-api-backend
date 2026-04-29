import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('addresses')
@UseGuards(FirebaseAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  getAddresses(@Req() req) {
    return this.addressesService.getAddresses(req.user.uid);
  }

  @Post()
  createAddress(@Req() req, @Body() body: any) {
    return this.addressesService.createAddress(req.user.uid, body);
  }
}
