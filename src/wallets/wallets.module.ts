import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { WalletBalance, WalletBalanceSchema } from './schemas/wallet.schema';
import { LedgerEntry, LedgerEntrySchema } from './schemas/ledger.schema';
import { UsersModule } from '../users/users.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WalletBalance.name, schema: WalletBalanceSchema },
      { name: LedgerEntry.name, schema: LedgerEntrySchema },
    ]),
    forwardRef(() => UsersModule),
    TransactionsModule,
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
