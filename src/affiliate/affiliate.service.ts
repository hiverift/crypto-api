import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Affiliate } from './schemas/affiliate.schema';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AffiliateService {
  constructor(
    @InjectModel(Affiliate.name) private affiliateModel: Model<Affiliate>,
    private usersService: UsersService,
  ) {}

  // ✅ Create Affiliate
  async createAffiliate(dto: CreateAffiliateDto) {
    try {
      const code = `AFF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const newAffiliate = await this.affiliateModel.create({
        ...dto,
        code,
      });

      const referralLink = `${process.env.FRONTEND_URL}/register?ref=${code}`;

      return {
        success: true,
        message: 'Affiliate created successfully',
        data: { referralLink, affiliate: newAffiliate },
      };
    } catch (error) {
      return { success: false, message: 'Error creating affiliate', error: error.message };
    }
  }

  // ✅ Get Affiliate by Code
  async getAffiliateByCode(code: string) {
    try {
      const affiliate = await this.affiliateModel.findOne({ code });
      if (!affiliate) {
        return { success: false, message: 'Affiliate not found' };
      }
      return { success: true, data: affiliate };
    } catch (error) {
      return { success: false, message: 'Error fetching affiliate by code', error: error.message };
    }
  }

  // ✅ Add Referral
  async addReferral(affiliateId: string, userId: string) {
    try {
      const affiliate = await this.affiliateModel.findById(affiliateId);
      if (!affiliate) {
        return { success: false, message: 'Affiliate not found' };
      }

      affiliate.referredUsers.push(userId);
      affiliate.totalReferrals++;
      await affiliate.save();

      return { success: true, message: 'Referral added successfully', data: affiliate };
    } catch (error) {
      return { success: false, message: 'Error adding referral', error: error.message };
    }
  }

  // ✅ Add Commission (with Level 1 & Level 2)
  async addCommission(affiliateId: string, amount: number) {
    try {
      if (!affiliateId || !amount) {
        throw new BadRequestException('Affiliate ID and amount are required');
      }

      const level1 = amount * parseFloat(process.env.AFFILIATE_LEVEL1_PERCENT || '0.05');
      const updatedAffiliate = await this.affiliateModel
        .findByIdAndUpdate(
          affiliateId,
          { $inc: { totalCommission: level1, withdrawable: level1 } },
          { new: true, runValidators: false }
        )
        .lean()
        .exec();

      if (!updatedAffiliate) {
        return { success: false, message: 'Affiliate not found' };
      }

      const result: any = {
        success: true,
        message: 'Commission added successfully',
        data: {
          affiliate: {
            id: updatedAffiliate._id,
            code: updatedAffiliate.code,
            level1CommissionAdded: level1,
            totalCommission: updatedAffiliate.totalCommission,
            withdrawable: updatedAffiliate.withdrawable,
          },
        },
      };

      if (updatedAffiliate.parentAffiliateId) {
        const level2 = amount * parseFloat(process.env.AFFILIATE_LEVEL2_PERCENT || '0.02');
        const updatedParent = await this.affiliateModel
          .findByIdAndUpdate(
            updatedAffiliate.parentAffiliateId,
            { $inc: { totalCommission: level2, withdrawable: level2 } },
            { new: true, runValidators: false }
          )
          .lean()
          .exec();

        if (updatedParent) {
          result.data.parentAffiliate = {
            id: updatedParent._id,
            code: updatedParent.code,
            level2CommissionAdded: level2,
            totalCommission: updatedParent.totalCommission,
            withdrawable: updatedParent.withdrawable,
          };
        }
      }

      return result;
    } catch (error) {
      console.error('Error adding commission:', error.message);
      return {
        success: false,
        message: 'Error while adding commission',
      
        error: error.message,
      };
    }
  }

  async withdraw(affiliateId: string, amount: number) {
    try {
      const aff = await this.affiliateModel.findById(affiliateId);
      if (!aff) return { success: false, message: 'Affiliate not found' };
      if (aff.withdrawable < amount) {
        return { success: false, message: 'Insufficient balance' };
      }

      aff.withdrawable -= amount;
      await aff.save();

      return {
        success: true,
        message: 'Withdrawal successful',
        data: { remaining: aff.withdrawable },
      };
    } catch (error) {
      return { success: false, message: 'Error during withdrawal', error: error.message };
    }
  }

  // ✅ Get Stats
  async getAffiliateStats(userId: string) {
    try {
      const stats = await this.affiliateModel.findOne({ userId });
      if (!stats) {
        return { success: false, message: 'Affiliate stats not found' };
      }
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, message: 'Error fetching affiliate stats', error: error.message };
    }
  }

  // ✅ Get Sub Affiliates
  async getSubAffiliates(parentId: string) {
    try {
      const subs = await this.affiliateModel.find({ parentAffiliateId: parentId });
      return { success: true, data: subs };
    } catch (error) {
      return { success: false, message: 'Error fetching sub affiliates', error: error.message };
    }
  }
}
