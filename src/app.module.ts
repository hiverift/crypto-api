
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { WalletsModule } from './wallets/wallets.module';
import { TransactionsModule } from './transactions/transactions.module';
import { OrdersModule } from './orders/orders.module';
import { OrderbookModule } from './orderbook/orderbook.module';
import { AffiliateModule } from './affiliate/affiliate.module';
import { KycModule } from './kyc/kyc.module';
import { WithdrawModule } from './withdraw/withdraw.module';
import { OnchainModule } from './onchain/onchain.module';
import { GatewaysModule } from './gateways/gateways.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { AffiliateAuthModule } from './affiliate-auth/affiliate-auth.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TradesModule } from './trades/trades.module';
import { DashboardModule } from './dashboard/dashboard.module';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb+srv://rs5045280:xbpneTRReMJD9LAc@cluster0.sbbouj5.mongodb.net/crypto_api'),
    MonitoringModule,
    UsersModule,
    AuthModule,
    WalletsModule,
    TransactionsModule,
    OrdersModule,
    OrderbookModule,  
    AffiliateModule,
    KycModule,
    WithdrawModule,
    OnchainModule,
    GatewaysModule,
    AffiliateAuthModule,
    AdminModule,
    AnalyticsModule,
    TradesModule,
    DashboardModule,
  
   
  ],
})
export class AppModule {}
