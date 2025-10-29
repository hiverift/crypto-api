import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Orderbook, OrderbookSchema } from './schemas/orderbook.schema';
import { OrderbookService } from './orderbook.service';
import { OrdersModule } from '../orders/orders.module';
import { WalletsModule } from '../wallets/wallets.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { AffiliateModule } from '../affiliate/affiliate.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Orderbook.name, schema: OrderbookSchema }]),
    forwardRef(() => OrdersModule), // <-- circular-safe import
    WalletsModule,
    TransactionsModule,
    AffiliateModule,
  ],
  providers: [OrderbookService],
  exports: [OrderbookService], // export if OrdersModule needs to inject it
})
export class OrderbookModule {}
