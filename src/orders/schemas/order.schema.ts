
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderSide, OrderType, OrderStatus } from '../../common/enums';
@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true }) user: Types.ObjectId;
  @Prop() symbol: string;
  @Prop() side: string;
  @Prop() type: string;
  @Prop() price?: number;
  @Prop() quantity: number;
  @Prop({ default: 0 }) filled: number;
  @Prop({ default: 'NEW' }) status: string;
}
export const OrderSchema = SchemaFactory.createForClass(Order);
