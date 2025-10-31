import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AffiliateUser extends Document {
  @Prop({ required: true, default: 'Guest' })
  name: string;

  @Prop({ required: true, unique: true, default: 'rs5045100@gmail.com' })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isAdmin: boolean;

  // New fields
  @Prop({ default: 'Unverified' })
  emailStatus: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  country: string;

  @Prop({ default: '' })
  whatsapp: string;

  @Prop({ default: '' })
  telegram: string;

  @Prop({ default: '' })
  link: string;

  @Prop({ default: '' })
  description: string;
}

export const AffiliateUserSchema = SchemaFactory.createForClass(AffiliateUser);
