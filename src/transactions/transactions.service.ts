import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { Transaction } from './schemas/transaction.schema';
import CustomError from 'src/providers/customer-error.service';
import CustomResponse from 'src/providers/custom-response.service';
import { throwException } from 'src/util/errorhandling';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private txModel: Model<Transaction>,
    @InjectConnection() private conn: Connection,
  ) {}

  // ----------------- START SESSION -----------------
  async startSession() {
    try {
      const session = await this.conn.startSession();
      return new CustomResponse(200, 'Session started successfully', session);
    } catch (error: any) {
      throwException(error);
    }
  }

  // ----------------- RECORD TRANSACTION -----------------
  async record(opts: any) {
    try {
      if (!opts.userId || !opts.asset || opts.amount === undefined || !opts.type) {
        throw new CustomError(400, 'Missing required fields: userId, asset, amount, or type');
      }

      const tx = await this.txModel.create(
        [
          {
            user: new Types.ObjectId(opts.userId),
            asset: opts.asset,
            amount: opts.amount,
            type: opts.type,
            meta: opts.meta || {},
          },
        ],
        { session: opts.session },
      );

      return new CustomResponse(201, 'Transaction recorded successfully', tx[0]);
    } catch (error: any) {
      console.error('Transaction record error:', error.message);
      throwException(error)
    }
  }
}
