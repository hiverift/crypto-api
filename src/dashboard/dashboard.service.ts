import { Injectable } from '@nestjs/common';
import { TradesService } from '../trades/trades.service';
import { WalletsService } from '../wallets/wallets.service';
import { OrdersService } from '../orders/orders.service';
import { AffiliateService } from '../affiliate/affiliate.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly trades: TradesService,
    private readonly wallets: WalletsService,
    private readonly orders: OrdersService,
    private readonly affiliates: AffiliateService,
  ) {}

  // 📊 Portfolio Summary (all wallet balances)
  async getPortfolio(userId: string) {
    const balances = await this.wallets.getAllBalances(userId, 'USER');
    const totalValue = balances.reduce(
      (acc, w) => acc + (w.available + w.locked),
      0,
    );
    return { totalValue, balances };
  }

  // 💰 Profit/Loss calculation (simple formula)
  async getPnL(userId: string) {
    const trades = await this.trades.getUserTrades(userId);
    let totalBuy = 0;
    let totalSell = 0;
    for (const t of trades) {
      if (t.takerId === userId) totalBuy += t.amount;
      if (t.makerId === userId) totalSell += t.amount;
    }
    const pnl = totalSell - totalBuy;
    return { totalBuy, totalSell, pnl };
  }

  // 💸 Fees summary
  async getFeeSummary(userId: string) {
    const trades = await this.trades.getUserTrades(userId);
    let totalFees = 0;
    for (const t of trades) {
      if (t.takerId === userId) totalFees += t.takerFee;
      if (t.makerId === userId) totalFees += t.makerFee;
    }
    return { totalFees };
  }

  // 🤝 Affiliate commissions summary
  async getAffiliateEarnings(userId: string) {
    const affiliate = await this.affiliates.getTotalCommissionStats(userId);
    return affiliate;
  }

  // 📑 Active + Completed Orders Overview
  async getOrderSummary(userId: string) {
    const allOrders = await this.orders.getUserOrders?.(userId);
   const openOrders = allOrders?.filter((o) => String(o.status) === 'NEW' || String(o.status) === 'OPEN') || [];



    const completedOrders = allOrders?.filter((o) => o.status === 'FILLED') || [];
    return {
      totalOrders: allOrders?.length || 0,
      open: openOrders.length,
      completed: completedOrders.length,
    };
  }

  // 📈 Final combined dashboard data
  async getFullDashboard(userId: string) {
    const [portfolio, pnl, fees, affiliate, orders] = await Promise.all([
      this.getPortfolio(userId),
      this.getPnL(userId),
      this.getFeeSummary(userId),
      this.getAffiliateEarnings(userId),
      this.getOrderSummary(userId),
    ]);

    return {
      userId,
      ...portfolio,
      pnl,
      fees,
      affiliate,
      orders,
    };
  }
}
