import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'orderbooks' })
export class Orderbook extends Document {
  // Pair symbol, e.g., "BTC/USDT"
  @Prop({ required: true, index: true, unique: true })
  symbol: string;

  // ✅ bids = array of buy orders
  @Prop({
    type: [
      {
        orderId: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        filled: { type: Number, default: 0 },
        userId: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  bids: Array<{
    orderId: string;
    price: number;
    quantity: number;
    filled: number;
    userId: string;
    createdAt: Date;
  }>;

  // ✅ asks = array of sell orders
  @Prop({
    type: [
      {
        orderId: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        filled: { type: Number, default: 0 },
        userId: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  asks: Array<{
    orderId: string;
    price: number;
    quantity: number;
    filled: number;
    userId: string;
    createdAt: Date;
  }>;
}

export const OrderbookSchema = SchemaFactory.createForClass(Orderbook);

// ✅ Optional but highly recommended for faster lookups
OrderbookSchema.index({ symbol: 1 });
