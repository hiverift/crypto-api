import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  symbol: string;

  @Prop({ enum: ['BUY', 'SELL'], required: true })
  side: string;

  @Prop({ enum: ['LIMIT', 'MARKET'], default: 'LIMIT' })
  type: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  quantity: number;

  @Prop({ default: 0 })
  filled: number;

  @Prop({ enum: ['OPEN', 'FILLED', 'CANCELLED'], default: 'OPEN' })
  status: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
