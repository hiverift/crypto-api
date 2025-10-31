// src/analytics/analytics.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Analytics, AnalyticsDocument } from './entities/analytics.entity';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { UpdateAnalyticsDto } from './dto/update-analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(@InjectModel(Analytics.name) private analyticsModel: Model<AnalyticsDocument>) {}

  async create(createAnalyticsDto: CreateAnalyticsDto): Promise<Analytics> {
    const createdAnalytics = new this.analyticsModel(createAnalyticsDto);
    return createdAnalytics.save();
  }

  async findAll(): Promise<Analytics[]> {
    return this.analyticsModel.find().sort({ date: 1 }).exec();
  }

  async findOne(id: string): Promise<Analytics> {
    const analytics = await this.analyticsModel.findById(id).exec();
    if (!analytics) {
      throw new NotFoundException(`Analytics #${id} not found`);
    }
    return analytics;
  }

  async update(id: string, updateAnalyticsDto: UpdateAnalyticsDto): Promise<Analytics> {
    const updatedAnalytics = await this.analyticsModel
      .findByIdAndUpdate(id, updateAnalyticsDto, { new: true })
      .exec();
    if (!updatedAnalytics) {
      throw new NotFoundException(`Analytics #${id} not found`);
    }
    return updatedAnalytics;
  }

  async getTotals(): Promise<{
    totalClicks: number;
    totalSignups: number;
    totalEarnings: number;
    conversionRate: number;
  }> {
    const analytics = await this.analyticsModel.aggregate([
      {
        $group: {
          _id: null,
          totalClicks: { $sum: '$clicks' },
          totalSignups: { $sum: '$signups' },
          totalEarnings: { $sum: '$earnings' },
        },
      },
    ]).exec();

    const result = analytics[0] || { totalClicks: 0, totalSignups: 0, totalEarnings: 0 };
    const conversionRate = result.totalSignups > 0 ? (result.totalClicks / result.totalSignups) * 100 : 0;
    return {
      ...result,
      conversionRate: Math.round(conversionRate * 10) / 10, 
    };
  }

  async getPerformanceOverview(startDate?: string, endDate?: string): Promise<Analytics[]> {
    const filter: any = {};
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) {
      if (!filter.date) filter.date = {};
      filter.date.$lte = new Date(endDate);
    }

    return this.analyticsModel.find(filter).sort({ date: 1 }).exec();
  }
  

  async incrementMetrics(date: string, increments: { clicks?: number; signups?: number; earnings?: number }): Promise<Analytics> {
    const analyticsDate = new Date(date);
    let analytics = await this.analyticsModel.findOne({ date: { $gte: analyticsDate, $lt: new Date(analyticsDate.getTime() + 24 * 60 * 60 * 1000) } }).exec();

    if (!analytics) {
      analytics = new this.analyticsModel({
        date: analyticsDate,
        clicks: 0,
        signups: 0,
        earnings: 0,
      });
    }

    if (increments.clicks) analytics.clicks += increments.clicks;
    if (increments.signups) analytics.signups += increments.signups;
    if (increments.earnings) analytics.earnings += increments.earnings;

    return analytics.save();
  }
}