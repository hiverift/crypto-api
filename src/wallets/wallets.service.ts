import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, ClientSession } from 'mongoose';
import { Wallet } from './schemas/wallet.schema';
import { TransactionsService } from '../transactions/transactions.service';
import { TxType } from '../common/enums';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectConnection() private conn: Connection,
    private txs: TransactionsService,
  ) {}

  async ensureUserWallet(userId: string) {
    const existing = await this.walletModel.findOne({ user: userId });
    if (existing) return existing;
    return this.walletModel.create({ user: userId });
  }

  async getMyWallet(userId: string) {
    const w = await this.walletModel.findOne({ user: userId });
    if (!w) throw new NotFoundException('Wallet not found');
    return w;
  }

  async reserveFunds(userId: string, asset: string, amount: number, session?: ClientSession) {
    const s = session || (await this.conn.startSession());
    const ownSession = !session;
    if (ownSession) s.startTransaction();
    try {
      const wallet = await this.walletModel.findOne({ user: userId }).session(s);
      if (!wallet) throw new NotFoundException('no wallet');
      const avail = Number(wallet.balances.get(asset) || 0);
      if (avail < amount) throw new BadRequestException('insufficient');
      wallet.balances.set(asset, +(avail - amount));
      const locked = Number(wallet.lockedBalances.get(asset) || 0);
      wallet.lockedBalances.set(asset, +(locked + amount));
      await wallet.save({ session: s });
      await this.txs.record({ userId, asset, amount: 0, type: TxType.TRADE, meta: { action: 'reserve', amount }, session: s });
      if (ownSession) await s.commitTransaction();
      return wallet;
    } catch (e) {
      if (ownSession) await s.abortTransaction();
      throw e;
    } finally {
      if (ownSession) s.endSession();
    }
  }

  async releaseLocked(userId: string, asset: string, amount: number, session?: ClientSession) {
    const s = session || (await this.conn.startSession());
    const ownSession = !session;
    if (ownSession) s.startTransaction();
    try {
      const wallet = await this.walletModel.findOne({ user: userId }).session(s);
      if (!wallet) throw new NotFoundException('no wallet');
      const locked = Number(wallet.lockedBalances.get(asset) || 0);
      if (locked < amount) throw new BadRequestException('not enough locked');
      wallet.lockedBalances.set(asset, +(locked - amount));
      const bal = Number(wallet.balances.get(asset) || 0);
      wallet.balances.set(asset, +(bal + amount));
      await wallet.save({ session: s });
      await this.txs.record({ userId, asset, amount: 0, type: TxType.TRADE, meta: { action: 'release', amount }, session: s });
      if (ownSession) await s.commitTransaction();
      return wallet;
    } catch (e) {
      if (ownSession) await s.abortTransaction();
      throw e;
    } finally {
      if (ownSession) s.endSession();
    }
  }

  // consume locked funds permanently (used when trade executes or withdraw confirms)
  async consumeLocked(userId: string, asset: string, amount: number, session?: ClientSession) {
    const s = session || (await this.conn.startSession());
    const ownSession = !session;
    if (ownSession) s.startTransaction();
    try {
      const wallet = await this.walletModel.findOne({ user: userId }).session(s);
      if (!wallet) throw new NotFoundException('no wallet');
      const locked = Number(wallet.lockedBalances.get(asset) || 0);
      if (locked < amount) throw new BadRequestException('not enough locked to consume');
      wallet.lockedBalances.set(asset, +(locked - amount));
      await wallet.save({ session: s });
      await this.txs.record({ userId, asset, amount: -amount, type: TxType.TRADE, meta: { action: 'consume', amount }, session: s });
      if (ownSession) await s.commitTransaction();
      return wallet;
    } catch (e) {
      if (ownSession) await s.abortTransaction();
      throw e;
    } finally {
      if (ownSession) s.endSession();
    }
  }

  async credit(userId: string, asset: string, amount: number, session?: ClientSession) {
    const s = session || (await this.conn.startSession());
    const ownSession = !session;
    if (ownSession) s.startTransaction();
    try {
      const wallet = await this.walletModel.findOneAndUpdate({ user: userId }, {}, { upsert: true, new: true, session: s });
      const bal = Number(wallet.balances.get(asset) || 0);
      wallet.balances.set(asset, +(bal + amount));
      await wallet.save({ session: s });
      await this.txs.record({ userId, asset, amount, type: TxType.TRADE, meta: { action: 'credit', amount }, session: s });
      if (ownSession) await s.commitTransaction();
      return wallet;
    } catch (e) {
      if (ownSession) await s.abortTransaction();
      throw e;
    } finally {
      if (ownSession) s.endSession();
    }
  }
}
