
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
@Schema({ timestamps: true })
export class Wallet extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true, unique: true }) user: Types.ObjectId;
  @Prop({ type: Map, of: Number, default: {} }) balances: Map<string, number>;
  @Prop({ type: Map, of: Number, default: {} }) lockedBalances: Map<string, number>;
}
export const WalletSchema = SchemaFactory.createForClass(Wallet);
