import { Module, forwardRef } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TradesModule } from '../trades/trades.module';
import { WalletsModule } from '../wallets/wallets.module';
import { OrdersModule } from '../orders/orders.module';
import { AffiliateModule } from '../affiliate/affiliate.module';

@Module({
  imports: [
    forwardRef(() => TradesModule),
    forwardRef(() => WalletsModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => AffiliateModule),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
