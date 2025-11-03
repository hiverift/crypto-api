// src/wallets/schemas/ledger.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class LedgerEntry extends Document {
  @Prop({ required: true }) ownerId: string;
  @Prop({ required: true }) ownerType: 'USER' | 'AFFILIATE';
  @Prop({ required: true }) asset: string;
  @Prop({ required: true }) change: number; // +ve or -ve
  @Prop() balanceAfter: number;
  @Prop({ required: true }) type: string; // 'DEPOSIT','WITHDRAW','RESERVE','RELEASE','TRADE','COMMISSION'
  @Prop() refId: string; // orderId / tradeId / txId
  @Prop() meta: any;
}

export const LedgerEntrySchema = SchemaFactory.createForClass(LedgerEntry);
