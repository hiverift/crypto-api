import { Injectable, BadRequestException } from '@nestjs/common';
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

  // ✅ Start a new MongoDB session
  async startSession() {
    try {
      const session = await this.conn.startSession();
      return {
        success: true,
        message: 'Session started successfully',
        data: session,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to start session',
        data: null,
        error: error.message,
      };
    }
  }

  // ✅ Record a new transaction
  async record(opts: any) {
    try {
      if (!opts.userId || !opts.asset || opts.amount === undefined || !opts.type) {
        throw new BadRequestException('Missing required fields: userId, asset, amount, or type');
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

      return {
        success: true,
        message: 'Transaction recorded successfully',
        data: tx[0],
        error: null,
      };
    } catch (error) {
      console.error('Transaction record error:', error.message);
      return {
        success: false,
        message: 'Failed to record transaction',
        data: null,
        error: error.message,
      };
    }
  }
}
