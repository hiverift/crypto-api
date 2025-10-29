
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
@Schema({ timestamps:true })
export class WithdrawalAddress extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User' }) user: Types.ObjectId;
  @Prop() asset: string;
  @Prop() label: string;
  @Prop() address: string;
}
export const WithdrawalAddressSchema = SchemaFactory.createForClass(WithdrawalAddress);
