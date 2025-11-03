import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ required: true })
  ownerId: string; // userId or affiliateId

  @Prop({ required: true, enum: ['USER', 'AFFILIATE'] })
  ownerType: 'USER' | 'AFFILIATE';

  @Prop({ required: true })
  asset: string; // e.g. USDT, BTC

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: ['DEPOSIT', 'WITHDRAW'] })
  type: 'DEPOSIT' | 'WITHDRAW';

  @Prop({ default: 'PENDING', enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Prop({ type: Object, default: {} })
  meta?: Record<string, any>;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
