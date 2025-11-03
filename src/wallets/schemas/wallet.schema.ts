import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class WalletBalance extends Document {
  @Prop({ required: true, index: true })
  ownerId: string; // userId या affiliateId

  @Prop({ required: true, enum: ['USER', 'AFFILIATE'], index: true })
  ownerType: 'USER' | 'AFFILIATE';

  @Prop({ required: true, index: true })
  asset: string; // e.g. 'USDT', 'BTC'

  @Prop({ default: 0 })
  available: number;

  @Prop({ default: 0 })
  locked: number;
}

export const WalletBalanceSchema = SchemaFactory.createForClass(WalletBalance);
WalletBalanceSchema.index({ ownerId: 1, ownerType: 1, asset: 1 }, { unique: true });
