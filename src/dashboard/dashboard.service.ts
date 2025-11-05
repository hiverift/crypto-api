import { Injectable, Logger } from '@nestjs/common';
import { TradesService } from '../trades/trades.service';
import { WalletsService } from '../wallets/wallets.service';
import { OrdersService } from '../orders/orders.service';
import { AffiliateService } from '../affiliate/affiliate.service';
import CustomResponse from 'src/providers/custom-response.service';
import { throwException } from 'src/util/errorhandling';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger('DashboardService');

  constructor(
    private readonly trades: TradesService,
    private readonly wallets: WalletsService,
    private readonly orders: OrdersService,
    private readonly affiliates: AffiliateService,
  ) {}

  /**
   * 📊 Get Portfolio Summary
   */
  async getPortfolio(userId: string) {
    try {
      const walletResp = await this.wallets.getAllBalances(userId, 'USER');
      const balances = walletResp?.result || walletResp?.data || walletResp || [];
      const totalValue = balances.reduce(
        (acc, w) => acc + ((w.available || 0) + (w.locked || 0)),
        0,
      );
      return new CustomResponse(200, 'Portfolio fetched successfully', {
        totalValue,
        balances,
      });
    } catch (err) {
      this.logger.error('Error fetching portfolio', err);
      throwException(err);
    }
  }

  /**
   * 💰 Profit & Loss Summary
   */
  async getPnL(userId: string) {
    try {
      const tradeResp = await this.trades.getUserTrades(userId);
      const trades = tradeResp?.result || tradeResp?.data || tradeResp || [];

      let totalBuy = 0;
      let totalSell = 0;

      for (const t of trades) {
        if (t.takerId === userId) totalBuy += t.amount || 0;
        if (t.makerId === userId) totalSell += t.amount || 0;
      }

      const pnl = totalSell - totalBuy;

      return new CustomResponse(200, 'PnL fetched successfully', {
        totalBuy,
        totalSell,
        pnl,
      });
    } catch (err) {
      this.logger.error('Error fetching PnL', err);
      throwException(err);
    }
  }

  /**
   * 💸 Total Fee Summary
   */
  async getFeeSummary(userId: string) {
    try {
      const tradeResp = await this.trades.getUserTrades(userId);
      const trades = tradeResp?.result || tradeResp?.data || tradeResp || [];

      let totalFees = 0;
      for (const t of trades) {
        if (t.takerId === userId) totalFees += t.takerFee || 0;
        if (t.makerId === userId) totalFees += t.makerFee || 0;
      }

      return new CustomResponse(200, 'Fee summary fetched successfully', {
        totalFees,
      });
    } catch (err) {
      this.logger.error('Error fetching fees', err);
      throwException(err);
    }
  }

  /**
   * 🤝 Affiliate Earnings Summary
   */
  async getAffiliateEarnings(userId: string) {
    try {
      const affiliateResp = await this.affiliates.getTotalCommissionStats(userId);
      const affiliate = affiliateResp?.result || affiliateResp?.data || affiliateResp || {};
      return new CustomResponse(200, 'Affiliate earnings fetched successfully', affiliate);
    } catch (err) {
      this.logger.error('Error fetching affiliate earnings', err);
      throwException(err);
    }
  }

  /**
   * 📑 Orders Overview (Active + Completed)
   */
  async getOrderSummary(userId: string) {
    try {
      const orderResp = await this.orders.getUserOrders?.(userId);
      const allOrders = orderResp?.result || orderResp?.data || orderResp || [];

      const openOrders =
        allOrders?.filter(
          (o) =>
            String(o.status) === 'NEW' ||
            String(o.status) === 'OPEN',
        ) || [];

      const completedOrders =
        allOrders?.filter((o) => String(o.status) === 'FILLED') || [];

      return new CustomResponse(200, 'Order summary fetched successfully', {
        totalOrders: allOrders.length || 0,
        open: openOrders.length,
        completed: completedOrders.length,
      });
    } catch (err) {
      this.logger.error('Error fetching order summary', err);
      throwException(err);
    }
  }

  /**
   * 📈 Full Combined Dashboard
   */
  async getFullDashboard(userId: string) {
    try {
      const [portfolioResp, pnlResp, feesResp, affiliateResp] = await Promise.all([
        this.getPortfolio(userId),
        this.getPnL(userId),
        this.getFeeSummary(userId),
        this.getAffiliateEarnings(userId),
        // this.getOrderSummary(userId),
      ]);

      const data = {
        userId,
        portfolio: portfolioResp.result || portfolioResp.data || portfolioResp,
        pnl: pnlResp.result || pnlResp.data || pnlResp,
        fees: feesResp.result || feesResp.data || feesResp,
        affiliate: affiliateResp.result || affiliateResp.data || affiliateResp,
      };

      return new CustomResponse(200, 'Full dashboard data fetched successfully', data);
    } catch (err) {
      this.logger.error('Error fetching full dashboard', err);
      throwException(err);
    }
  }
}
