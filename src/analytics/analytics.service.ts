// src/analytics/analytics.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Analytics, AnalyticsDocument } from './entities/analytics.entity';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { UpdateAnalyticsDto } from './dto/update-analytics.dto';
import CustomResponse from 'src/providers/custom-response.service';
import { throwException } from 'src/util/errorhandling';

@Injectable()
export class AnalyticsService {
  constructor(@InjectModel(Analytics.name) private analyticsModel: Model<AnalyticsDocument>) {}

  async create(createAnalyticsDto: CreateAnalyticsDto) {
    try {
      const createdAnalytics = new this.analyticsModel(createAnalyticsDto);
      const saved = await createdAnalytics.save();
      return new CustomResponse(200, 'Analytics created successfully', saved);
    } catch (err: any) {
      throwException(err);
    }
  }

  async findAll() {
    try {
      const all = await this.analyticsModel.find().sort({ date: 1 }).exec();
      return new CustomResponse(200, 'Analytics fetched successfully', all);
    } catch (err: any) {
      throwException(err);
    }
  }

  async findOne(id: string) {
    try {
      const analytics = await this.analyticsModel.findById(id).exec();
      if (!analytics) throw new NotFoundException(`Analytics #${id} not found`);
      return new CustomResponse(200, 'Analytics fetched successfully', analytics);
    } catch (err: any) {
      throwException(err);
    }
  }

  async update(id: string, updateAnalyticsDto: UpdateAnalyticsDto) {
    try {
      const updatedAnalytics = await this.analyticsModel
        .findByIdAndUpdate(id, updateAnalyticsDto, { new: true })
        .exec();
      if (!updatedAnalytics) throw new NotFoundException(`Analytics #${id} not found`);
      return new CustomResponse(200, 'Analytics updated successfully', updatedAnalytics);
    } catch (err: any) {
      throwException(err);
    }
  }

  async getTotals() {
    try {
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

      return new CustomResponse(200, 'Analytics totals fetched successfully', {
        ...result,
        conversionRate: Math.round(conversionRate * 10) / 10,
      });
    } catch (err: any) {
      throwException(err);
    }
  }

  async getPerformanceOverview(startDate?: string, endDate?: string) {
    try {
      const filter: any = {};
      if (startDate) filter.date = { $gte: new Date(startDate) };
      if (endDate) {
        if (!filter.date) filter.date = {};
        filter.date.$lte = new Date(endDate);
      }

      const data = await this.analyticsModel.find(filter).sort({ date: 1 }).exec();
      return new CustomResponse(200, 'Performance overview fetched successfully', data);
    } catch (err: any) {
      throwException(err);
    }
  }

  async incrementMetrics(date: string, increments: { clicks?: number; signups?: number; earnings?: number }) {
    try {
      const analyticsDate = new Date(date);
      let analytics = await this.analyticsModel.findOne({
        date: { $gte: analyticsDate, $lt: new Date(analyticsDate.getTime() + 24 * 60 * 60 * 1000) },
      }).exec();

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

      const saved = await analytics.save();
      return new CustomResponse(200, 'Analytics metrics incremented successfully', saved);
    } catch (err: any) {
      throwException(err);
    }
  }
}
