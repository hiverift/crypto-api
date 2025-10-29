
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TxType } from '../../common/enums';
@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true }) user: Types.ObjectId;
  @Prop() asset: string;
  @Prop() amount: number;
  @Prop() type: string;
  @Prop({ type: Object, default: {} }) meta: Record<string, any>;
}
export const TransactionSchema = SchemaFactory.createForClass(Transaction);
