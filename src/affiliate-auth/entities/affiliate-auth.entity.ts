import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AffiliateUser extends Document {
  @Prop({ required: true }) name: string;
  @Prop({ required: true, unique: true }) email: string;
  @Prop({ required: true }) password: string;
  @Prop({ default: false }) isAdmin: boolean;
}

export const AffiliateUserSchema = SchemaFactory.createForClass(AffiliateUser);
