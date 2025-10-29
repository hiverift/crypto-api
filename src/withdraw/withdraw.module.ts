
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WithdrawalAddress, WithdrawalAddressSchema } from './schemas/address.schema';
import { WithdrawService } from './withdraw.service';
import { OnchainModule } from '../onchain/onchain.module';
import { WalletsModule } from '../wallets/wallets.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports:[MongooseModule.forFeature([{ name: WithdrawalAddress.name, schema: WithdrawalAddressSchema }]), OnchainModule, WalletsModule, TransactionsModule],
  providers:[WithdrawService],
  exports:[WithdrawService],
})
export class WithdrawModule {}
