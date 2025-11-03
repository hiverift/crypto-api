// src/orderbook/orderbook.service.ts
import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Orderbook } from './schemas/orderbook.schema';
import { OrdersService } from '../orders/orders.service';
import { WalletsService } from '../wallets/wallets.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AffiliateService } from '../affiliate/affiliate.service';
import { Order } from '../orders/schemas/order.schema';

type ObjectIdLike = any;

/**
 * Internal book entry type (keeps only fields needed for matching + persistence in snapshot)
 * This is intentionally NOT the full mongoose Order document type to avoid TS mismatches.
 */
interface BookEntry {
  orderId: string;
  price: number;
  quantity: number;
  filled: number;
  userId: string;
  createdAt: Date;
  // optional extra fields that might exist on live Order documents
  [k: string]: any;
}

interface Book {
  bids: BookEntry[];
  asks: BookEntry[];
}

interface TradeRecord {
  bid: BookEntry;
  ask: BookEntry;
  tradePrice: number;
  tradeQty: number;
}

@Injectable()
export class OrderbookService {
  private logger = new Logger('OrderbookService');

  // in-memory orderbooks by symbol
  private books: Map<string, Book> = new Map();

  constructor(
    @InjectModel(Orderbook.name) private obModel: Model<Orderbook>,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly wallets: WalletsService,
    private readonly txs: TransactionsService,
    private readonly affiliate: AffiliateService,
  ) {}

  // load or init book snapshot
  async ensureBook(symbol: string): Promise<Book> {
    if (!this.books.has(symbol)) {
      const doc = await this.obModel.findOne({ symbol }).lean().exec();
      // doc?.bids/asks are stored as simplified entries (not full Order docs)
      const bids = (doc?.bids as BookEntry[]) || [];
      const asks = (doc?.asks as BookEntry[]) || [];
      this.books.set(symbol, { bids, asks });
    }
    return this.books.get(symbol)!;
  }

  // Called by OrdersService after creating an order document
  // Accepts either a full Order doc or a minimal shape; we convert to BookEntry
  async onNewLimitOrder(order: any) {
    const symbol = order.symbol;
    const book = await this.ensureBook(symbol);
    if (!book) throw new Error('Orderbook initialization failed');

    // convert incoming order (mongoose Order doc) -> BookEntry
    const entry: BookEntry = {
      orderId: String(order._id ?? order.id ?? order.orderId ?? 'ord-' + Date.now()),
      price: Number(order.price),
      quantity: Number(order.quantity),
      filled: Number(order.filled || 0),
      userId: String(order.user ?? order.userId ?? order.userId?.toString?.() ?? 'unknown'),
      createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
      ...((order as any).extras || {}),
    };

    if ((order as any).side === 'BUY' || (order.side ?? order.type) === 'BUY') {
      book.bids.push(entry);
      book.bids.sort((a, b) => {
        if (b.price !== a.price) return b.price - a.price;
        return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
      });
    } else {
      book.asks.push(entry);
      book.asks.sort((a, b) => {
        if (a.price !== b.price) return a.price - b.price;
        return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
      });
    }

    // persist snapshot (top 50)
    await this.persistBookSnapshot(symbol, book);

    // try matching asynchronously (do not block order creation)
    this.match(symbol).catch(err => {
      this.logger.error('Error while matching', err);
    });
  }

  // core match loop (keeps matching while top bid >= top ask)
  async match(symbol: string) {
    const book = await this.ensureBook(symbol);
    if (!book) return;

    const trades: TradeRecord[] = [];

    while (book.bids.length > 0 && book.asks.length > 0) {
      const bid = book.bids[0];
      const ask = book.asks[0];

      if (!bid || !ask) break;

      // price-time priority: match only if bid.price >= ask.price
      if ((Number(bid.price) || 0) < (Number(ask.price) || 0)) break;

      const price = Number(ask.price);
      const availableBid = (Number(bid.quantity) - Number(bid.filled)) || 0;
      const availableAsk = (Number(ask.quantity) - Number(ask.filled)) || 0;
      const qty = Math.min(availableBid, availableAsk);

      if (qty <= 0) {
        // clean up zero-size entries
        if (availableBid <= 0) book.bids.shift();
        if (availableAsk <= 0) book.asks.shift();
        continue;
      }

      // update fill counters in-memory
      bid.filled = (Number(bid.filled) || 0) + qty;
      ask.filled = (Number(ask.filled) || 0) + qty;

      if ((Number(bid.filled) || 0) >= (Number(bid.quantity) || 0)) book.bids.shift();
      if ((Number(ask.filled) || 0) >= (Number(ask.quantity) || 0)) book.asks.shift();

      this.logger.log(`Matched ${qty} ${symbol} @ ${price} (bid:${bid.orderId} ask:${ask.orderId})`);

      // attempt atomic wallet/txs/affiliate operations
      try {
        await this.executeTradeHandlers(bid, ask, qty, price, symbol);
      } catch (err) {
        // if wallet/tx failed we should **rollback** or mark for manual reconciliation.
        // For now: log error and continue (you should implement compensation or transactional flow).
        this.logger.error('executeTradeHandlers failed', err);
      }

      trades.push({ bid, ask, tradePrice: price, tradeQty: qty });
    }

    // persist snapshot after matching
    await this.persistBookSnapshot(symbol, book);

    if (trades.length > 0) {
      // Optionally: emit websocket / event bus here
      this.logger.log(`Executed ${trades.length} trade(s) for ${symbol}`);
    }
  }

  // persist top-of-book snapshot
  private async persistBookSnapshot(symbol: string, book: Book) {
    try {
      await this.obModel.findOneAndUpdate(
        { symbol },
        { symbol, bids: book.bids.slice(0, 50), asks: book.asks.slice(0, 50) },
        { upsert: true },
      ).exec();
    } catch (err) {
      this.logger.error('Persist book snapshot failed', err);
    }
  }

  /**
   * Execute wallet/tx/affiliate operations related to a filled trade.
   * NOTE: This function uses optional method calls on external services to avoid TS errors.
   * Replace or adapt the method names to your actual WalletsService / TransactionsService / AffiliateService.
   */
  private async executeTradeHandlers(bid: BookEntry, ask: BookEntry, qty: number, price: number, symbol: string) {
    const [base, quote] = symbol.split('/');
    const tradeQuoteAmount = qty * price;
    const taker = String(bid.userId);
    const maker = String(ask.userId);

    // ---- 1) Record trade in transaction service (if available)
    if (this.txs && typeof (this.txs as any).recordTrade === 'function') {
      try {
        await (this.txs as any).recordTrade({
          symbol,
          price,
          quantity: qty,
          makerId: maker,
          takerId: taker,
          makerOrderId: ask.orderId,
          takerOrderId: bid.orderId,
          timestamp: new Date(),
        });
      } catch (err) {
        this.logger.warn('txs.recordTrade failed', err);
      }
    } else {
      this.logger.debug('TransactionsService.recordTrade not implemented - skipping');
    }

    // ---- 2) Wallet operations
    // NOTE: you should implement atomic debit/credit or use DB transactions / ledger service.
    // We attempt credits (receiver gets funds) and reduce locked funds if methods exist.

    // credit buyer with base asset
    if (this.wallets && typeof (this.wallets as any).credit === 'function') {
      try {
        await (this.wallets as any).credit(taker, base, qty);
      } catch (err) {
        this.logger.warn('wallets.credit(taker) failed', err);
      }
    } else {
      this.logger.debug('wallets.credit not implemented - buyer credit skipped');
    }

    // credit seller with quote amount
    if (this.wallets && typeof (this.wallets as any).credit === 'function') {
      try {
        await (this.wallets as any).credit(maker, quote, tradeQuoteAmount);
      } catch (err) {
        this.logger.warn('wallets.credit(maker) failed', err);
      }
    }

    // consume / unlock locked funds (names vary by implementation)
    // try multiple possible method names safely
    const consumeCandidates = ['consumeLocked', 'consumeReserved', 'consume', 'debit'];
    for (const fn of consumeCandidates) {
      if (this.wallets && typeof (this.wallets as any)[fn] === 'function') {
        try {
          // for buyer we consumed quote currency (cost)
          await (this.wallets as any)[fn](taker, quote, tradeQuoteAmount);
          // for seller we consumed base currency (qty)
          await (this.wallets as any)[fn](maker, base, qty);
          break;
        } catch (err) {
          this.logger.debug(`wallets.${fn} failed`, err);
        }
      }
    }

    // ---- 3) Affiliate commission hook (optional)
    if (this.affiliate && typeof (this.affiliate as any).handleTradeCommission === 'function') {
      try {
        await (this.affiliate as any).handleTradeCommission({
          symbol,
          amount: tradeQuoteAmount,
          makerId: maker,
          takerId: taker,
        });
      } catch (err) {
        this.logger.warn('affiliate.handleTradeCommission failed', err);
      }
    } else {
      this.logger.debug('AffiliateService.handleTradeCommission not implemented - skipping');
    }
  }
}