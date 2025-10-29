import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Orderbook } from './schemas/orderbook.schema';
import { OrdersService } from '../orders/orders.service';
import { WalletsService } from '../wallets/wallets.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AffiliateService } from '../affiliate/affiliate.service';

@Injectable()
export class OrderbookService {
  private logger = new Logger('OrderbookService');
  private books: Map<string, { bids: any[]; asks: any[] }> = new Map();

  constructor(
  @InjectModel(Orderbook.name) private obModel: Model<Orderbook>,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly wallets: WalletsService,
    private readonly txs: TransactionsService,
    private readonly affiliate: AffiliateService,                  // index 4,
  ) {}

  async ensureBook(symbol: string) {
    if (!this.books.has(symbol)) {
      const bookFromDb = await this.obModel.findOne({ symbol }).lean().exec();
      const bids = (bookFromDb && Array.isArray(bookFromDb.bids)) ? bookFromDb.bids : [];
      const asks = (bookFromDb && Array.isArray(bookFromDb.asks)) ? bookFromDb.asks : [];
      this.books.set(symbol, { bids, asks });
    }
    // non-null assertion: we guarantee it exists here
    return this.books.get(symbol)!;
  }

  async onNewLimitOrder(order: any) {
    const symbol = order.symbol;
    const book = await this.ensureBook(symbol);
    if (!book) throw new Error('Orderbook initialization failed');

    if (order.side === 'BUY') {
      book.bids.push(order);
    } else {
      book.asks.push(order);
    }

    // maintain price-time priority
    book.bids.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    book.asks.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));

    // persist a snapshot (optional)
    await this.obModel.findOneAndUpdate(
      { symbol },
      { symbol, bids: book.bids.slice(0, 50), asks: book.asks.slice(0, 50) },
      { upsert: true },
    ).exec();

    // attempt match
    await this.match(symbol);
  }

  async match(symbol: string) {
    const book = await this.ensureBook(symbol);
    if (!book) return;

    const base = symbol.split('/')[0];
    const quote = symbol.split('/')[1];

    while (book.bids.length > 0 && book.asks.length > 0) {
      const bid = book.bids[0];
      const ask = book.asks[0];
      if (!bid || !ask) break;
      if ((Number(bid.price) || 0) < (Number(ask.price) || 0)) break;

      const price = Number(ask.price);
      const qty = Math.min((Number(bid.quantity) - Number(bid.filled)) || 0, (Number(ask.quantity) - Number(ask.filled)) || 0);
      if (qty <= 0) {
        // invalid order sizes: remove and continue
        if ((Number(bid.quantity) - Number(bid.filled)) <= 0) book.bids.shift();
        if ((Number(ask.quantity) - Number(ask.filled)) <= 0) book.asks.shift();
        continue;
      }

      // NOTE: This simplified loop logs match; real matching must use DB transactions and wallet ops.
      bid.filled = (Number(bid.filled) || 0) + qty;
      ask.filled = (Number(ask.filled) || 0) + qty;

      if ((Number(bid.filled) || 0) >= (Number(bid.quantity) || 0)) book.bids.shift();
      if ((Number(ask.filled) || 0) >= (Number(ask.quantity) || 0)) book.asks.shift();

      this.logger.log(`Matched ${qty} ${symbol} @ ${price}`);
      // TODO: persist trade and update wallets atomically
    }

    // persist snapshot after matching
    await this.obModel.findOneAndUpdate(
      { symbol },
      { symbol, bids: book.bids.slice(0, 50), asks: book.asks.slice(0, 50) },
      { upsert: true },
    ).exec();
  }
}
