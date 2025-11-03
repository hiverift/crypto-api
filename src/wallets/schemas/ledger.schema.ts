import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class LedgerEntry extends Document {
  @Prop({ required: true })
  ownerId: string;

  @Prop({ required: true, enum: ['USER', 'AFFILIATE'] })
  ownerType: 'USER' | 'AFFILIATE';

  @Prop({ required: true })
  asset: string;

  @Prop({ required: true })
  change: number;

  @Prop()
  balanceAfter?: number;

  @Prop({ required: true })
  type: string; // RESERVE, RELEASE, CREDIT, DEBIT, etc.

  @Prop()
  refId?: string; // orderId/tradeId/txId

 @Prop({ type: Object, default: {} })
meta: Record<string, any>;
}

export const LedgerEntrySchema = SchemaFactory.createForClass(LedgerEntry);
