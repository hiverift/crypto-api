import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Order } from './schemas/order.schema';
import { WalletsService } from '../wallets/wallets.service';
import { TransactionsService } from '../transactions/transactions.service';
import { OrderbookService } from '../orderbook/orderbook.service';
import CustomError from 'src/providers/customer-error.service';
import CustomResponse from 'src/providers/custom-response.service';
import { throwException } from 'src/util/errorhandling';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectConnection() private conn: Connection,
    private wallets: WalletsService,
    private txs: TransactionsService,
    @Inject(forwardRef(() => OrderbookService))
    private readonly orderbook: OrderbookService,
  ) {}

  async place(userId: string, dto: any) {
    const [base, quote] = (dto.symbol || '').split('/');
    if (!base || !quote) throw new CustomError(400, 'Invalid trading pair');

    const session = await this.conn.startSession();
    session.startTransaction();

    try {
      // Reserve funds
      if (dto.type === 'LIMIT') {
        if (dto.side === 'BUY') {
          const cost = Number(dto.quantity) * Number(dto.price);
          await this.wallets.reserveFunds(userId, quote, cost, session);
        } else {
          await this.wallets.reserveFunds(userId, base, dto.quantity, session);
        }
      }

      // Create order
      const [order] = await this.orderModel.create(
        [{ user: new Types.ObjectId(userId), ...dto, filled: 0, status: 'OPEN' }],
        { session },
      );

      await session.commitTransaction();

      // Add to orderbook (asynchronously)
      this.orderbook.onNewLimitOrder(order).catch(console.error);

      return new CustomResponse(201, 'Order placed successfully', order);
    } catch (err: any) {
      await session.abortTransaction();
      throwException(err);
    } finally {
      session.endSession();
    }
  }
}
