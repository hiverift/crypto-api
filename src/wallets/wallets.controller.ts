
import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { WalletsService } from './wallets.service';

@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private wallets: WalletsService) {}
  @Get('me') me(@CurrentUser() user:any){ return this.wallets.getMyWallet(user.sub); }
  @Post('deposit') deposit(@CurrentUser() user:any, @Body() body:any){ return this.wallets.credit(user.sub, body.asset, Number(body.amount)); }
}
