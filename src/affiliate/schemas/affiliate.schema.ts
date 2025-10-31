
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Affiliate extends Document {
  @Prop({ type: String, required: true, unique: true })
  userId: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ default: null })
  parentAffiliateId?: string;

  @Prop({ default: 0 })
  totalReferrals: number;

  @Prop({ type: [String], default: [] })
  subAffiliates: string[];
  @Prop({ default: 0 })
  
  totalCommission: number;

  @Prop({ default: 0 })
  withdrawable: number;

  @Prop({ type: [String], default: [] })
  referredUsers: string[];
}

export const AffiliateSchema = SchemaFactory.createForClass(Affiliate);
