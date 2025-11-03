import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Transaction } from './schemas/transaction.schema';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private txModel: Model<Transaction>,
    private readonly wallets: WalletsService,
  ) {}

  async deposit(ownerId: string, ownerType: 'USER' | 'AFFILIATE', asset: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Invalid amount');

    const session = await this.txModel.db.startSession();
    session.startTransaction();

    try {
      // credit wallet
      await this.wallets.credit(ownerId, ownerType, asset, amount, session);

      // record transaction
      const tx = await this.txModel.create(
        [{ ownerId, ownerType, asset, amount, type: 'DEPOSIT', status: 'APPROVED' }],
        { session },
      );

      await session.commitTransaction();
      return { message: 'Deposit successful', tx: tx[0] };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async requestWithdraw(ownerId: string, ownerType: 'USER' | 'AFFILIATE', asset: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Invalid amount');

    // create withdraw request
    const tx = await this.txModel.create({
      ownerId,
      ownerType,
      asset,
      amount,
      type: 'WITHDRAW',
      status: 'PENDING',
    });

    return { message: 'Withdraw request submitted', tx };
  }

  async approveWithdraw(txId: string, session?: ClientSession) {
    const tx = await this.txModel.findById(txId);
    if (!tx) throw new BadRequestException('Transaction not found');
    if (tx.status !== 'PENDING') throw new BadRequestException('Already processed');

    await this.wallets.debit(tx.ownerId, tx.ownerType, tx.asset, tx.amount, session);
    tx.status = 'APPROVED';
    await tx.save({ session });

    return { message: 'Withdrawal approved', tx };
  }

  async rejectWithdraw(txId: string) {
    const tx = await this.txModel.findById(txId);
    if (!tx) throw new BadRequestException('Transaction not found');
    tx.status = 'REJECTED';
    await tx.save();
    return { message: 'Withdrawal rejected', tx };
  }

  async getHistory(ownerId: string, ownerType: 'USER' | 'AFFILIATE') {
    return this.txModel.find({ ownerId, ownerType }).sort({ createdAt: -1 }).lean().exec();
  }

  async record(data: {
  userId: string;
  asset: string;
  amount: number;
  type: string;
  meta?: any;
  session?: any;
}) {
  const tx = await this.txModel.create([
    {
      userId: data.userId,
      asset: data.asset,
      amount: data.amount,
      type: data.type,
      meta: data.meta || {},
    },
  ], { session: data.session });

  return tx[0];
}
}
