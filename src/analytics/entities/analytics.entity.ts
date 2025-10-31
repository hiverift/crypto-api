
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnalyticsDocument = Analytics & Document;

@Schema({ timestamps: true })
export class Analytics {
  @Prop({ required: true, unique: true })
  date: Date;

  @Prop({ required: true, default: 0 })
  clicks: number;

  @Prop({ required: true, default: 0 })
  signups: number;

  @Prop({ required: true, default: 0 })
  earnings: number;
}

export const AnalyticsSchema = SchemaFactory.createForClass(Analytics);