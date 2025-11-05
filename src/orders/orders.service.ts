import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from './schemas/order.schema';
import { WalletsService } from 'src/wallets/wallets.service';
import { OrderbookService } from 'src/orderbook/orderbook.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order & Document>,
    private wallets: WalletsService,
    private orderbook: OrderbookService,
  ) { }

  // 🧩 Place new order (Buy / Sell)
  async placeOrder(
    userId: string,
    dto: {
      symbol: string;
      side: 'BUY' | 'SELL';
      type: 'LIMIT' | 'MARKET';
      price?: number;
      quantity: number;
      expiry?: string | number; // optional expiry
    },
  ) {
    const { symbol, side, type, price, quantity, expiry } = dto;

    if (!symbol || !side || !type || !quantity)
      throw new Error('Missing required fields');


    let expiryDate: Date;
    if (expiry) {
      expiryDate = new Date(expiry);
      if (isNaN(expiryDate.getTime())) throw new Error('Invalid expiry format');
    } else {

      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
    }


    const [base, quote] = symbol.includes('/')
      ? symbol.split('/')
      : [symbol.slice(0, symbol.length - 4), symbol.slice(symbol.length - 4)];


    const orderDoc = await this.orderModel.create({
      user: userId,
      symbol,
      side,
      type,
      price,
      quantity,
      filled: 0,
      status: 'OPEN',
      expiry: expiryDate,
    });

    const lockKey = (orderDoc as any)._id.toString();


    if (side === 'BUY') {
      const lockAmount =
        type === 'MARKET' ? (price || 0) * quantity : (price! * quantity);
      await this.wallets.lockFunds(userId, 'USER', quote, lockAmount, lockKey);
    } else {
      await this.wallets.lockFunds(userId, 'USER', base, quantity, lockKey);
    }

    console.log('coming in on new limti order',orderDoc)
    await this.orderbook.onNewLimitOrder(orderDoc);

    return {
      message: 'Order placed successfully',
      order: orderDoc,
    };
  }


  async cancelOrder(userId: string, orderId: string) {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new Error('Order not found');
    if (order.user.toString() !== userId.toString())
      throw new Error('Not your order');

    if (['FILLED', 'CANCELLED'].includes(order.status))
      throw new Error('Order cannot be cancelled');

    order.status = 'CANCELLED';
    await order.save();


    const lockKey = orderId;
    const [base, quote] = order.symbol.includes('/')
      ? order.symbol.split('/')
      : [order.symbol.slice(0, order.symbol.length - 4), order.symbol.slice(order.symbol.length - 4)];

    if (order.side === 'BUY') {
      await this.wallets.releaseLocked(userId, 'USER', quote, lockKey);
    } else {
      await this.wallets.releaseLocked(userId, 'USER', base, lockKey);
    }


    await this.orderbook.removeOrderFromBook(orderId, order.symbol);

    return {
      message: 'Order cancelled successfully',
      order,
    };
  }


  async getUserOrders(userId: string) {
    const orders = await this.orderModel
      .find({ user: userId })
      .select('symbol side type price quantity status expiry createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return {
      message: 'User orders retrieved successfully',
      count: orders.length,
      orders,
    };
  }

  // 🧩 Auto-expire orders (can be scheduled CRON)
  async expireOrders() {
    const now = new Date();
    const expiredOrders = await this.orderModel.find({
      expiry: { $lte: now },
      status: { $in: ['OPEN', 'NEW'] },
    });

    for (const order of expiredOrders) {
      order.status = 'EXPIRED';
      await order.save();

      const lockKey = order.id.toString();
      const [base, quote] = order.symbol.includes('/')
        ? order.symbol.split('/')
        : [order.symbol.slice(0, order.symbol.length - 4), order.symbol.slice(order.symbol.length - 4)];

      if (order.side === 'BUY') {
        await this.wallets.releaseLocked(order.user.toString(), 'USER', quote, lockKey);
      } else {
        await this.wallets.releaseLocked(order.user.toString(), 'USER', base, lockKey);
      }

      await this.orderbook.removeOrderFromBook(order.id.toString(), order.symbol);
    }

    return {
      message: `${expiredOrders.length} orders expired successfully.`,
    };
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .select('symbol side type price quantity filled status expiry createdAt updatedAt')
      .lean()
      .exec();

    if (!order) throw new Error('Order not found');
    if (order.user?.toString?.() && order.user.toString() !== userId)
      throw new Error('You are not authorized to view this order');

    return {
      message: 'Order fetched successfully',
      order,
    };
  }
}
