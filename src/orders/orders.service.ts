
import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Order } from './schemas/order.schema';
import { WalletsService } from '../wallets/wallets.service';
import { TransactionsService } from '../transactions/transactions.service';
import { OrderbookService } from '../orderbook/orderbook.service';

@Injectable()
export class OrdersService {
  constructor(@InjectModel(Order.name) private orderModel: Model<Order>, @InjectConnection() private conn: Connection,
    private wallets: WalletsService, private txs: TransactionsService,
   @Inject(forwardRef(() => OrderbookService))
    private readonly orderbook: OrderbookService) {}

  async place(userId:string, dto:any){
    const [base, quote] = (dto.symbol||'').split('/');
    if(!base||!quote) throw new BadRequestException('invalid symbol');
    const session = await this.conn.startSession();
    session.startTransaction();
    try{
      if(dto.type==='LIMIT'){
        if(dto.side==='BUY'){
          const cost = Number(dto.quantity)*Number(dto.price);
          await this.wallets.reserveFunds(userId, quote, cost, session);
        }else{
          await this.wallets.reserveFunds(userId, base, dto.quantity, session);
        }
      }
      const created = await this.orderModel.create([{
        user: new Types.ObjectId(userId),
        ...dto, filled:0, status:'NEW'
      }], { session });
      await session.commitTransaction();
      const order = created[0];
      // notify orderbook
      await this.orderbook.onNewLimitOrder(order);
      return order;
    }catch(e){
      await session.abortTransaction();
      throw e;
    }finally{ session.endSession(); }
  }
}
