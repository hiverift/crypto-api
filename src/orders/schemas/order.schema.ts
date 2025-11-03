import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { OrderSide, OrderType, OrderStatus } from '../../common/enums';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  symbol: string;

  @Prop({ required: true, enum: ['BUY', 'SELL'] })
  side: OrderSide | string;

  @Prop({ required: true, enum: ['LIMIT', 'MARKET'] })
  type: OrderType | string;

  @Prop({ type: Number, required: false })
  price?: number;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ default: 0 })
  filled: number;

  @Prop({ default: 'NEW', enum: ['NEW', 'OPEN', 'FILLED', 'CANCELLED'] })
  status: OrderStatus | string;

  // ← IMPORTANT: explicitly set meta type to Mixed (arbitrary object)
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  meta?: Record<string, any>;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
