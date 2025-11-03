import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly txs: TransactionsService) {}

  @Post('deposit')
  async deposit(@CurrentUser() user: any, @Body() body: { asset: string; amount: number }) {
    const ownerType = user.role === 'AFFILIATE' ? 'AFFILIATE' : 'USER';
    return this.txs.deposit(user.sub, ownerType, body.asset, Number(body.amount));
  }

  @Post('withdraw')
  async withdraw(@CurrentUser() user: any, @Body() body: { asset: string; amount: number }) {
    const ownerType = user.role === 'AFFILIATE' ? 'AFFILIATE' : 'USER';
    return this.txs.requestWithdraw(user.sub, ownerType, body.asset, Number(body.amount));
  }

  @Get('history')
  async history(@CurrentUser() user: any) {
    const ownerType = user.role === 'AFFILIATE' ? 'AFFILIATE' : 'USER';
    return this.txs.getHistory(user.sub, ownerType);
  }
}
