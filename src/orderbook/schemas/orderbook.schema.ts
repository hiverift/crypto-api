
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema({ timestamps: true })
export class Orderbook extends Document {
  @Prop() symbol: string;
  @Prop({ type: Array, default: [] }) bids: any[];
  @Prop({ type: Array, default: [] }) asks: any[];
}
export const OrderbookSchema = SchemaFactory.createForClass(Orderbook);
