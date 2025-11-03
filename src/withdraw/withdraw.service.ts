
import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { WithdrawalAddress } from './schemas/address.schema';
import { WalletsService } from '../wallets/wallets.service';
import { TransactionsService } from '../transactions/transactions.service';
import { OnchainService } from '../onchain/onchain.service';

@Injectable()
export class WithdrawService {
  constructor(@InjectModel(WithdrawalAddress.name) private addrModel: Model<WithdrawalAddress>,
    @InjectConnection() private conn: Connection, private wallets: WalletsService, private txs: TransactionsService, private onchain: OnchainService) {}

  async addAddress(userId:string, asset:string, label:string, address:string){ return this.addrModel.create({ user:userId, asset, label, address }); }

  async requestWithdraw(userId:string, asset:string, addressId:string, amount:number){
    const addr = await this.addrModel.findById(addressId);
    if(!addr) throw new Error('addr not found');
    const session = await this.conn.startSession();
    session.startTransaction();
    try{
     await this.wallets.reserveFunds(userId, 'USER', asset, amount, session);
      await this.txs.record({ userId, asset, amount: -amount, type:'WITHDRAWAL', meta:{ address: addr.address }, session });
      const tx = await this.onchain.sendToAddress(asset, addr.address, amount);
      await this.wallets.consumeLocked(userId, 'USER', asset, amount, session);
      await session.commitTransaction();
      return { ok:true, tx };
    }catch(e){
      await session.abortTransaction();
      throw e;
    }finally{ session.endSession(); }
  }
}
