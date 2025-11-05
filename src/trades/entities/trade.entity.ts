import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Trade extends Document {
  @Prop({ required: true })
  symbol: string; 

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  amount: number; // price * quantity

  @Prop({ required: true })
  makerId: string;

  @Prop({ required: true })
  takerId: string;

  @Prop({ required: true })
  makerOrderId: string;

  @Prop({ required: true })
  takerOrderId: string;

  @Prop({ default: 0 })
  makerFee: number;

  @Prop({ default: 0 })
  takerFee: number;

  @Prop({ default: 'TRADE' })
  type: string;

  @Prop({ type: Object, default: {} })
  meta?: Record<string, any>;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);
