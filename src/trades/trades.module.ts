import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Trade,TradeSchema } from './entities/trade.entity';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { WalletsModule } from '../wallets/wallets.module';
import { AffiliateModule } from '../affiliate/affiliate.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Trade.name, schema: TradeSchema }]),
    forwardRef(() => WalletsModule),
    forwardRef(() => AffiliateModule),
  ],
  controllers: [TradesController],
  providers: [TradesService],
  exports: [TradesService],
})
export class TradesModule {}
