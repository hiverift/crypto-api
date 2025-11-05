import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { WalletsModule } from '../wallets/wallets.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { OrderbookModule } from '../orderbook/orderbook.module';
import { AuthModule } from 'src/auth/auth.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    WalletsModule,
    TransactionsModule,
    AuthModule,
    forwardRef(() => OrderbookModule), // allow circular ref
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService], // MUST export so other modules can inject it
})
export class OrdersModule {}
