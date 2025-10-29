
import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Transaction } from './schemas/transaction.schema';
import { Types } from 'mongoose';

@Injectable()
export class TransactionsService {
  constructor(@InjectModel(Transaction.name) private txModel: Model<Transaction>, @InjectConnection() private conn: Connection) {}
  async startSession(){ return this.conn.startSession(); }
  async record(opts:any){ return this.txModel.create([{
    user: new Types.ObjectId(opts.userId),
    asset: opts.asset,
    amount: opts.amount,
    type: opts.type,
    meta: opts.meta || {}
  }], { session: opts.session }); }
}
