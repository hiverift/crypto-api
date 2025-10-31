import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, ClientSession, Types } from 'mongoose';
import { Wallet } from './schemas/wallet.schema';
import { TransactionsService } from '../transactions/transactions.service';
import { TxType } from '../common/enums';
import CustomError from 'src/providers/customer-error.service';
import CustomResponse from 'src/providers/custom-response.service';
import { throwException } from 'src/util/errorhandling';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectConnection() private conn: Connection,
    private txs: TransactionsService,
  ) {}

  // ----------------- ENSURE WALLET -----------------
  async ensureUserWallet(userId: string) {
    try {
      let wallet = await this.walletModel.findOne({ user: userId });
      if (!wallet) {
        wallet = await this.walletModel.create({ user: userId });
      }
      return new CustomResponse(200, 'Wallet retrieved successfully', wallet);
    } catch (err: any) {
      throwException(err);
    }
  }

  // ----------------- GET WALLET -----------------
  async getMyWallet(userId: string) {
    try {
      const w = await this.walletModel.findOne({ user: userId });
      if (!w) throw new CustomError(404, 'Wallet not found');
      return new CustomResponse(200, 'Wallet retrieved successfully', w);
    } catch (err: any) {
      throwException(err);
    }
  }

  // ----------------- RESERVE FUNDS -----------------
  async reserveFunds(userId: string, asset: string, amount: number, session?: ClientSession) {
    const s = session || (await this.conn.startSession());
    const ownSession = !session;
    if (ownSession) s.startTransaction();

    try {
      const wallet = await this.walletModel.findOne({ user: userId }).session(s);
      if (!wallet) throw new CustomError(404, 'Wallet not found');

      const avail = Number(wallet.balances.get(asset) || 0);
      if (avail < amount) throw new CustomError(400, 'Insufficient balance');

      wallet.balances.set(asset, +(avail - amount));
      const locked = Number(wallet.lockedBalances.get(asset) || 0);
      wallet.lockedBalances.set(asset, +(locked + amount));
      await wallet.save({ session: s });

      await this.txs.record({
        userId,
        asset,
        amount: 0,
        type: TxType.TRADE,
        meta: { action: 'reserve', amount },
        session: s,
      });

      if (ownSession) await s.commitTransaction();
      return new CustomResponse(200, 'Funds reserved successfully', wallet);
    } catch (err: any) {
      if (ownSession) await s.abortTransaction();
      throwException(err);
    } finally {
      if (ownSession) s.endSession();
    }
  }

  // ----------------- RELEASE LOCKED FUNDS -----------------
  async releaseLocked(userId: string, asset: string, amount: number, session?: ClientSession) {
    const s = session || (await this.conn.startSession());
    const ownSession = !session;
    if (ownSession) s.startTransaction();

    try {
      const wallet = await this.walletModel.findOne({ user: userId }).session(s);
      if (!wallet) throw new CustomError(404, 'Wallet not found');

      const locked = Number(wallet.lockedBalances.get(asset) || 0);
      if (locked < amount) throw new CustomError(400, 'Not enough locked balance');

      wallet.lockedBalances.set(asset, +(locked - amount));
      const bal = Number(wallet.balances.get(asset) || 0);
      wallet.balances.set(asset, +(bal + amount));
      await wallet.save({ session: s });

      await this.txs.record({
        userId,
        asset,
        amount: 0,
        type: TxType.TRADE,
        meta: { action: 'release', amount },
        session: s,
      });

      if (ownSession) await s.commitTransaction();
      return new CustomResponse(200, 'Locked funds released successfully', wallet);
    } catch (err: any) {
      if (ownSession) await s.abortTransaction();
      throwException(err);
    } finally {
      if (ownSession) s.endSession();
    }
  }

  // ----------------- CONSUME LOCKED FUNDS -----------------
  async consumeLocked(userId: string, asset: string, amount: number, session?: ClientSession) {
    const s = session || (await this.conn.startSession());
    const ownSession = !session;
    if (ownSession) s.startTransaction();

    try {
      const wallet = await this.walletModel.findOne({ user: userId }).session(s);
      if (!wallet) throw new CustomError(404, 'Wallet not found');

      const locked = Number(wallet.lockedBalances.get(asset) || 0);
      if (locked < amount) throw new CustomError(400, 'Not enough locked balance to consume');

      wallet.lockedBalances.set(asset, +(locked - amount));
      await wallet.save({ session: s });

      await this.txs.record({
        userId,
        asset,
        amount: -amount,
        type: TxType.TRADE,
        meta: { action: 'consume', amount },
        session: s,
      });

      if (ownSession) await s.commitTransaction();
      return new CustomResponse(200, 'Locked funds consumed successfully', wallet);
    } catch (err: any) {
      if (ownSession) await s.abortTransaction();
      throwException(err);
    } finally {
      if (ownSession) s.endSession();
    }
  }

  // ----------------- CREDIT FUNDS -----------------
  async credit(userId: string, asset: string, amount: number, session?: ClientSession) {
    const s = session || (await this.conn.startSession());
    const ownSession = !session;
    if (ownSession) s.startTransaction();

    try {
      const wallet = await this.walletModel.findOneAndUpdate(
        { user: userId },
        {},
        { upsert: true, new: true, session: s }
      );

      const bal = Number(wallet.balances.get(asset) || 0);
      wallet.balances.set(asset, +(bal + amount));
      await wallet.save({ session: s });

      await this.txs.record({
        userId,
        asset,
        amount,
        type: TxType.TRADE,
        meta: { action: 'credit', amount },
        session: s,
      });

      if (ownSession) await s.commitTransaction();
      return new CustomResponse(200, 'Funds credited successfully', wallet);
    } catch (err: any) {
      if (ownSession) await s.abortTransaction();
      throwException(err);
    } finally {
      if (ownSession) s.endSession();
    }
  }
}
