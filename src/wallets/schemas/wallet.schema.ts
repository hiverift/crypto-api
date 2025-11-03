// src/wallets/schemas/wallet.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class WalletBalance extends Document {
  @Prop({ required: true, index: true }) ownerId: string; // userId or affiliateId
  @Prop({ required: true }) ownerType: 'USER' | 'AFFILIATE';
  @Prop({ required: true }) asset: string; // 'USDT','BTC'
  @Prop({ default: 0 }) available: number;
  @Prop({ default: 0 }) locked: number;
}

export const WalletBalanceSchema = SchemaFactory.createForClass(WalletBalance);
