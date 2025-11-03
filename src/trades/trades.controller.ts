import { Controller, Get, UseGuards } from '@nestjs/common';
import { TradesService } from './trades.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('trades')
export class TradesController {
  constructor(private readonly trades: TradesService) {}

  @Get('my')
  async myTrades(@CurrentUser() user: any) {
    return this.trades.getUserTrades(user.sub);
  }
}
