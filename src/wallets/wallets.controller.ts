import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { WalletsService } from './wallets.service';

@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private wallets: WalletsService) {}

  @Get('me')
  async me(@CurrentUser() user: any) {
    return this.wallets.getMyWallet(user.sub);
  }

  @Post('deposit')
  async deposit(@CurrentUser() user: any, @Body() body: any) {
    const { asset, amount } = body;
    return this.wallets.credit(user.sub, asset, Number(amount));
  }
}
