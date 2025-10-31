import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Kyc extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', unique: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: String, default: 'PENDING' })
  status: 'PENDING' | 'APPROVED' | 'REJECTED';


  @Prop({ type: Object, default: {} })
  documents: Record<string, any>;

  @Prop({ type: String, default: '' })
  notes?: string;
}

export const KycSchema = SchemaFactory.createForClass(Kyc);
