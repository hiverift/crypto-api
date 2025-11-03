import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { Model } from 'mongoose';
import { WalletsService } from 'src/wallets/wallets.service';
import { OrderbookService } from 'src/orderbook/orderbook.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order & Document>,
    private wallets: WalletsService,
    private orderbook: OrderbookService,
  ) {}

  // place order
  async placeOrder(userId: string, dto: { symbol: string; side: 'BUY'|'SELL'; type: string; price?: number; quantity: number }) {
    const { symbol, side, type, price, quantity } = dto;

    // naive pair parse
    const base = symbol.slice(0, symbol.length - 4);
    const quote = symbol.slice(symbol.length - 4);

    // create DB order
    const orderDoc = await this.orderModel.create({
      userId,
      symbol,
      side,
      type,
      price,
      quantity,
      filled: 0,
      status: 'OPEN',
    });

  const lockKey = (orderDoc as any)._id.toString();




    if (side === 'BUY') {
      // For buy limit: lock quote = price * quantity
      const lockAmount = type === 'MARKET' ? (price || 0) * quantity : (price! * quantity);
      await this.wallets.lockFunds(userId, quote, lockAmount, lockKey);
    } else {
      // SELL: lock base quantity
      await this.wallets.lockFunds(userId, base, quantity, lockKey);
    }

    // Add to in-memory orderbook & attempt match
    await this.orderbook.onNewLimitOrder(orderDoc);

    return orderDoc;
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new Error('Order not found');
    if (order.user.toString() !== userId.toString()) throw new Error('Not your order');

    if (order.status === 'FILLED' || order.status === 'CANCELLED') throw new Error('Cannot cancel');

    order.status = 'CANCELLED';
    await order.save();

    // release locked funds
    const lockKey = orderId;
    const symbol = order.symbol;
    const base = symbol.slice(0, symbol.length - 4);
    const quote = symbol.slice(symbol.length - 4);

    if (order.side === 'BUY') {
      // release quote
      await this.wallets.releaseLocked(userId, quote, lockKey);
    } else {
      await this.wallets.releaseLocked(userId, base, lockKey);
    }

    // remove from in-memory book
    await this.orderbook.removeOrderFromBook(orderId, symbol);

    return order;
  }

  async getUserOrders(userId: string) {
  return this.orderModel.find({ userId }).sort({ createdAt: -1 }).exec();
}
}
