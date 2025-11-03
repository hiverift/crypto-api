import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Affiliate } from '../affiliate/schemas/affiliate.schema';
import { AffiliateUser } from 'src/affiliate-auth/entities/affiliate-auth.entity';
import CustomResponse from 'src/providers/custom-response.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Affiliate.name) private readonly affiliates: Model<Affiliate>,
    @InjectModel(AffiliateUser.name) private readonly affiliateUsers: Model<AffiliateUser>,
  ) {}

  // ✅ Get all affiliates list
  async getAllAffiliates() {
    const all = await this.affiliates.find().sort({ createdAt: -1 }).lean();
    return new CustomResponse(200, 'All affiliates fetched successfully', all);
  }

  // ✅ Get details of single affiliate + linked user
  async getAffiliateDetails(id: string) {
    const affiliate = await this.affiliates.findById(id).lean();
    if (!affiliate) throw new NotFoundException('Affiliate not found');

    const user = await this.affiliateUsers.findById(affiliate.userId)
      .select('-password')
      .lean();

    return new CustomResponse(200, 'Affiliate details retrieved', { affiliate, user });
  }

  // ✅ Get transactions summary of all affiliates
  async getTransactions() {
    const affiliates = await this.affiliates.find().lean();

    const transactions = affiliates.map((a) => ({
      code: a.code,
      totalCommission: a.totalCommission || 0,
      withdrawable: a.withdrawable || 0,
      totalReferrals: a.totalReferrals || 0,
      referredCount: (a.referredUsers || []).length,
    }));

    return new CustomResponse(200, 'Affiliate transaction summary', transactions);
  }

  // ✅ Get dashboard data for a specific affiliate by userId
  async getAffiliateDashboard(userId: string) {
    const affiliate = await this.affiliates.findOne({ userId }).lean();
    if (!affiliate) throw new NotFoundException('Affiliate not found');

    const dashboard = {
      userId: affiliate.userId,
      code: affiliate.code,
      parentAffiliateId: affiliate.parentAffiliateId,
      totalCommission: affiliate.totalCommission || 0,
      withdrawable: affiliate.withdrawable || 0,
      totalReferrals: affiliate.totalReferrals || 0,
      totalReferralRegistered: (affiliate.referredUsers || []).length,
      referredUsers: affiliate.referredUsers || [],
      createdAt: affiliate.createdAt,
      updatedAt: affiliate.updatedAt,
    };

    return new CustomResponse(200, 'Affiliate dashboard data fetched', dashboard);
  }

  // ✅ Optional: get top affiliates by commission
  async getTopAffiliates(limit = 10) {
    const top = await this.affiliates
      .find()
      .sort({ totalCommission: -1 })
      .limit(limit)
      .select('code totalCommission totalReferrals withdrawable')
      .lean();

    return new CustomResponse(200, 'Top affiliates fetched', top);
  }
}
