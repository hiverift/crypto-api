import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Trade } from './entities/trade.entity';
import { WalletsService } from '../wallets/wallets.service';
import { AffiliateService } from '../affiliate/affiliate.service';

@Injectable()
export class TradesService {
  private logger = new Logger('TradesService');

  constructor(
    @InjectModel(Trade.name) private tradeModel: Model<Trade>,
    private readonly wallets: WalletsService,
    private readonly affiliate: AffiliateService,
  ) {}

  /**
   * Create trade between maker and taker
   */
  async recordTrade(data: {
    symbol: string;
    price: number;
    quantity: number;
    makerId: string;
    takerId: string;
    makerOrderId: string;
    takerOrderId: string;
  }) {
    const { symbol, price, quantity, makerId, takerId, makerOrderId, takerOrderId } = data;

    const [base, quote] = symbol.split('/');
    const amount = price * quantity;

    const session = await this.tradeModel.db.startSession();
    session.startTransaction();

    try {
      // Fees
      const makerFeeRate = 0.001; // 0.1%
      const takerFeeRate = 0.002; // 0.2%
      const makerFee = amount * makerFeeRate;
      const takerFee = amount * takerFeeRate;

      // Maker: sells base, gets quote
      await this.wallets.debit(makerId, 'USER', base, quantity, session);
      await this.wallets.credit(makerId, 'USER', quote, amount - makerFee, session);

      // Taker: buys base, pays quote
      await this.wallets.debit(takerId, 'USER', quote, amount, session);
      await this.wallets.credit(takerId, 'USER', base, quantity, session);

      // Save trade record
      const trade = await this.tradeModel.create(
        [
          {
            symbol,
            price,
            quantity,
            amount,
            makerId,
            takerId,
            makerOrderId,
            takerOrderId,
            makerFee,
            takerFee,
          },
        ],
        { session },
      );

      // Affiliate Commission
      await this.affiliate.handleTradeCommission?.(takerId, makerId, amount);

      await session.commitTransaction();

      this.logger.log(`Trade executed: ${quantity} ${symbol} @ ${price}`);
      return trade[0];
    } catch (e) {
      await session.abortTransaction();
      this.logger.error('Trade error', e);
      throw e;
    } finally {
      session.endSession();
    }
  }

  async getUserTrades(userId: string) {
    return this.tradeModel
      .find({ $or: [{ makerId: userId }, { takerId: userId }] })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }
}
