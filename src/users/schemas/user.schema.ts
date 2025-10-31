// user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ unique: true, index: true }) email: string;
  @Prop() name: string;
  @Prop({ select: false }) password: string;
  @Prop() role: string;
  @Prop() referredBy?: string;

  // New keys
  @Prop({ default: 'Unverified' }) emailStatus: string;
  @Prop({ default: '' }) phone: string;
  @Prop({ default: '' }) country: string;
  @Prop({ default: '' }) whatsapp: string;
  @Prop({ default: '' }) telegram: string;
  @Prop({ default: '' }) link: string;
  @Prop({ default: '' }) description: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
