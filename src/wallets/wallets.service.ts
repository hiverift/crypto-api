import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { WalletBalance } from './schemas/wallet.schema';
import { LedgerEntry } from './schemas/ledger.schema';

@Injectable()
export class WalletsService {
  private logger = new Logger('WalletsService');

  constructor(
    @InjectModel(WalletBalance.name) private readonly balances: Model<WalletBalance>,
    @InjectModel(LedgerEntry.name) private readonly ledger: Model<LedgerEntry>,
  ) {}

  // -------- Get Wallets --------
  async getWalletsByOwner(ownerId: string, ownerType: 'USER' | 'AFFILIATE' = 'USER') {
    const docs = await this.balances.find({ ownerId, ownerType }).lean().exec();
    return { ownerId, ownerType, wallets: docs };
  }

  // -------- Helpers --------
  private async getOrCreateBalance(
    ownerId: string,
    ownerType: 'USER' | 'AFFILIATE' = 'USER',
    asset: string,
    session?: ClientSession,
  ) {
    let doc = await this.balances
      .findOne({ ownerId, ownerType, asset })
      .session(session ?? null)
      .exec();

    if (!doc) {
      const created = await this.balances.create(
        [{ ownerId, ownerType, asset, available: 0, locked: 0 }],
        { session },
      );
      doc = created[0];
    }
    return doc;
  }

  // -------- Reserve --------
  async reserveFunds(
    ownerId: string,
    ownerType: 'USER' | 'AFFILIATE' = 'USER',
    asset: string,
    amount: number,
    session: ClientSession,
  ) {
    if (amount <= 0) throw new Error('Invalid amount');
    const bal = await this.getOrCreateBalance(ownerId, ownerType, asset, session);
    if (bal.available < amount) throw new Error('Insufficient funds');

    await this.balances
      .updateOne({ _id: bal._id }, { $inc: { available: -amount, locked: +amount } }, { session })
      .exec();

    const newBal = await this.balances.findById(bal._id).session(session ?? null).exec();
    if (!newBal) throw new Error('Wallet not found after reserve');

    await this.ledger.create(
      [
        {
          ownerId,
          ownerType,
          asset,
          change: -amount,
          balanceAfter: newBal.available,
          type: 'RESERVE',
        },
      ],
      { session },
    );

    return newBal;
  }

  // -------- Release --------
  async releaseFunds(
    ownerId: string,
    ownerType: 'USER' | 'AFFILIATE' = 'USER',
    asset: string,
    amount: number,
    session?: ClientSession,
  ) {
    if (amount <= 0) throw new Error('Invalid amount');
    const bal = await this.getOrCreateBalance(ownerId, ownerType, asset, session);
    if (bal.locked < amount) throw new Error('Locked funds insufficient');

    await this.balances
      .updateOne({ _id: bal._id }, { $inc: { locked: -amount, available: +amount } }, { session })
      .exec();

    const newBal = await this.balances.findById(bal._id).session(session ?? null).exec();
    if (!newBal) throw new Error('Wallet not found after release');

    await this.ledger.create(
      [
        {
          ownerId,
          ownerType,
          asset,
          change: +amount,
          balanceAfter: newBal.available,
          type: 'RELEASE',
        },
      ],
      { session },
    );

    return newBal;
  }

  // -------- Consume Locked --------
  async consumeLocked(
    ownerId: string,
    ownerType: 'USER' | 'AFFILIATE' = 'USER',
    asset: string,
    amount: number,
    session?: ClientSession,
  ) {
    if (amount <= 0) throw new Error('Invalid amount');
    const bal = await this.getOrCreateBalance(ownerId, ownerType, asset, session);
    if (bal.locked < amount) throw new Error('Locked funds insufficient');

    await this.balances
      .updateOne({ _id: bal._id }, { $inc: { locked: -amount } }, { session })
      .exec();

    const newBal = await this.balances.findById(bal._id).session(session ?? null).exec();
    if (!newBal) throw new Error('Wallet not found after consume');

    await this.ledger.create(
      [
        {
          ownerId,
          ownerType,
          asset,
          change: -amount,
          balanceAfter: newBal.available,
          type: 'CONSUME',
        },
      ],
      { session },
    );

    return newBal;
  }

  // -------- Credit --------
  async credit(
    ownerId: string,
    ownerType: 'USER' | 'AFFILIATE' = 'USER',
    asset: string,
    amount: number,
    session?: ClientSession,
  ) {
    if (amount <= 0) throw new Error('Invalid amount');
    const bal = await this.getOrCreateBalance(ownerId, ownerType, asset, session);

    await this.balances.updateOne({ _id: bal._id }, { $inc: { available: +amount } }, { session }).exec();

    const newBal = await this.balances.findById(bal._id).session(session ?? null).exec();
    if (!newBal) throw new Error('Wallet not found after credit');

    await this.ledger.create(
      [
        {
          ownerId,
          ownerType,
          asset,
          change: +amount,
          balanceAfter: newBal.available,
          type: 'CREDIT',
        },
      ],
      { session },
    );

    return newBal;
  }

  // -------- Debit --------
  async debit(
    ownerId: string,
    ownerType: 'USER' | 'AFFILIATE' = 'USER',
    asset: string,
    amount: number,
    session?: ClientSession,
  ) {
    if (amount <= 0) throw new Error('Invalid amount');
    const bal = await this.getOrCreateBalance(ownerId, ownerType, asset, session);
    if (bal.available < amount) throw new Error('Insufficient funds');

    await this.balances.updateOne({ _id: bal._id }, { $inc: { available: -amount } }, { session }).exec();

    const newBal = await this.balances.findById(bal._id).session(session ?? null).exec();
    if (!newBal) throw new Error('Wallet not found after debit');

    await this.ledger.create(
      [
        {
          ownerId,
          ownerType,
          asset,
          change: -amount,
          balanceAfter: newBal.available,
          type: 'DEBIT',
        },
      ],
      { session },
    );

    return newBal;
  }

  // -------- Lock Funds --------
  async lockFunds(
    ownerId: string,
    ownerType: 'USER' | 'AFFILIATE' = 'USER',
    asset: string,
    amount: number,
    lockKey: string,
    session?: ClientSession
  ) {
    const bal = await this.balances.findOneAndUpdate(
      { ownerId, ownerType, asset },
      { $inc: { locked: amount, available: -amount } },
      { new: true, upsert: true, session }
    );

    await this.ledger.create([
      {
        ownerId,
        ownerType,
        asset,
        change: -amount,
        balanceAfter: bal.available,
        type: 'LOCK',
        meta: { lockKey },
      },
    ]);

    return bal;
  }

  // -------- Release Locked --------
  async releaseLocked(
    ownerId: string,
    ownerType: 'USER' | 'AFFILIATE' = 'USER',
    asset: string,
    lockKey: string,
    session?: ClientSession
  ) {
    const bal = await this.balances.findOneAndUpdate(
      { ownerId, ownerType, asset },
      { $inc: { locked: -1, available: +1 } },
      { new: true, session }
    );

    if (!bal) throw new Error(`Wallet balance not found for ${ownerId} ${asset}`);

    await this.ledger.create([
      {
        ownerId,
        ownerType,
        asset,
        change: +1,
        balanceAfter: bal.available,
        type: 'RELEASE',
        meta: { lockKey },
      },
    ]);

    return bal;
  }

  // -------- Get All Balances --------
  async getAllBalances(ownerId: string, ownerType: 'USER' | 'AFFILIATE' = 'USER') {
    return this.balances.find({ ownerId, ownerType }).lean().exec();
  }
}
