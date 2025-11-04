import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly wallets: WalletsService) { }



  @Post('credit')
  async credit(@CurrentUser() user: any, @Body() body: { asset: string; amount: number }) {
    const { asset, amount } = body;
    const ownerType = user.role === 'AFFILIATE' ? 'AFFILIATE' : 'USER';
    return this.wallets.credit(user.sub, ownerType, asset, Number(amount));
  }


  @Get('me')
  async myWallets(@CurrentUser() user: any) {
    const ownerType = user.role === 'AFFILIATE' ? 'AFFILIATE' : 'USER';
    return this.wallets.getWalletsByOwner(user.sub, ownerType);
  }



}
