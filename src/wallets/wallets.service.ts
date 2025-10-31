import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, ClientSession } from 'mongoose';
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

  async ensureUserWallet(userId: string) {
    try {
      const existing = await this.walletModel.findOne({ user: userId });
      if (existing) throw new CustomResponse(200, 'Wallet found successfully', existing);

      const newWallet = await this.walletModel.create({ user: userId });
      throw new CustomResponse(201, 'Wallet created successfully', newWallet);
    } catch (error) {
      throwException(error);
    }
  }

  async getMyWallet(userId: string) {
    try {
      const wallet = await this.walletModel.findOne({ user: userId });
      if (!wallet) throw new NotFoundException('Wallet not found');

      throw new CustomResponse(200, 'Wallet fetched successfully', wallet);
    } catch (error) {
      throwException(error);
    }
  }
  async reserveFunds(userId: string, asset: string, amount: number, session?: ClientSession) {
    const s = session || (await this.conn.startSession());
    const ownSession = !session;
    if (ownSession) s.startTransaction();
    try {
      const wallet = await this.walletModel.findOne({ user: userId }).session(s);
      if (!wallet) throw new NotFoundException('Wallet not found');

      const available = Number(wallet.balances.get(asset) || 0);
      if (available < amount) throw new BadRequestException('Insufficient balance');

      wallet.balances.set(asset, available - amount);
      const locked = Number(wallet.lockedBalances.get(asset) || 0);
      wallet.lockedBalances.set(asset, locked + amount);

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
      throw new CustomResponse(200, 'Funds reserved successfully', wallet);
    } catch (error) {
      if (ownSession) await s.abortTransaction();
      throwException(error);
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
      if (!wallet) throw new NotFoundException('Wallet not found');

      const locked = Number(wallet.lockedBalances.get(asset) || 0);
      if (locked < amount) throw new BadRequestException('Not enough locked balance');

      wallet.lockedBalances.set(asset, locked - amount);
      const bal = Number(wallet.balances.get(asset) || 0);
      wallet.balances.set(asset, bal + amount);

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
      throw new CustomResponse(200, 'Locked funds released successfully', wallet);
    } catch (error) {
      if (ownSession) await s.abortTransaction();
      throwException(error);
    } finally {
      if (ownSession) s.endSession();
    }
  }

  async consumeLocked(userId: string, asset: string, amount: number, session?: ClientSession) {
    const s = session || (await this.conn.startSession());
    const ownSession = !session;
    if (ownSession) s.startTransaction();
    try {
      const wallet = await this.walletModel.findOne({ user: userId }).session(s);
      if (!wallet) throw new NotFoundException('Wallet not found');

      const locked = Number(wallet.lockedBalances.get(asset) || 0);
      if (locked < amount) throw new BadRequestException('Not enough locked balance to consume');

      wallet.lockedBalances.set(asset, locked - amount);
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
      throw new CustomResponse(200, 'Locked funds consumed successfully', wallet);
    } catch (error) {
      if (ownSession) await s.abortTransaction();
      throwException(error);
    } finally {
      if (ownSession) s.endSession();
    }
  }

  async credit(userId: string, asset: string, amount: number, session?: ClientSession) {
    const s = session || (await this.conn.startSession());
    const ownSession = !session;
    if (ownSession) s.startTransaction();
    try {
      if (!asset || !amount) throw new BadRequestException('Asset and amount are required');

      const wallet = await this.walletModel.findOneAndUpdate(
        { user: userId },
        {},
        { upsert: true, new: true, session: s },
      );

      const bal = Number(wallet.balances.get(asset) || 0);
      wallet.balances.set(asset, bal + amount);
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
      throw new CustomResponse(200, 'Deposit successful', wallet);
    } catch (error) {
      if (ownSession) await s.abortTransaction();
      throwException(error);
    } finally {
      if (ownSession) s.endSession();
    }
  }
}
