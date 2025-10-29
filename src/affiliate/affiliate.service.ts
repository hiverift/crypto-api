// src/affiliate/affiliate.service.ts
import { Injectable } from '@nestjs/common';
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
  ) { }

  async createAffiliate(dto: CreateAffiliateDto) {
    const code = `AFF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newAffiliate = await this.affiliateModel.create({
      ...dto,
      code,
    });

    const referralLink = `${process.env.FRONTEND_URL}/register?ref=${code}`;

    return { message: 'Affiliate created', referralLink, affiliate: newAffiliate };
  }

  async getAffiliateByCode(code: string) {
    return this.affiliateModel.findOne({ code });
  }

  async addReferral(affiliateId: string, userId: string) {
    const affiliate = await this.affiliateModel.findById(affiliateId);
    if (!affiliate) return null;

    affiliate.referredUsers.push(userId);
    affiliate.totalReferrals++;
    await affiliate.save();
  }

async addCommission(affiliateId: string, amount: number) {
  try {
    if (!affiliateId || !amount) {
      return { success: false, message: 'Affiliate ID and amount are required' };
    }

    // Level 1 commission (direct affiliate)
    const level1 = amount * parseFloat(process.env.AFFILIATE_LEVEL1_PERCENT || '0.05');

    // Atomic update for direct affiliate
    const updatedAffiliate = await this.affiliateModel.findByIdAndUpdate(
      affiliateId,
      {
        $inc: { totalCommission: level1, withdrawable: level1 },
      },
      { new: true, runValidators: false } // disable validation for speed/safety
    ).lean().exec();

    if (!updatedAffiliate) {
      return { success: false, message: 'Affiliate not found' };
    }

    // Prepare response data
    const result: any = {
      success: true,
      message: 'Commission added successfully',
      affiliate: {
        id: updatedAffiliate._id,
        code: updatedAffiliate.code,
        level1CommissionAdded: level1,
        totalCommission: updatedAffiliate.totalCommission + level1,
        withdrawable: updatedAffiliate.withdrawable + level1,
      },
    };

    // Level 2 commission (parent affiliate)
    if (updatedAffiliate.parentAffiliateId) {
      const level2 = amount * parseFloat(process.env.AFFILIATE_LEVEL2_PERCENT || '0.02');

      const updatedParent = await this.affiliateModel.findByIdAndUpdate(
        updatedAffiliate.parentAffiliateId,
        {
          $inc: { totalCommission: level2, withdrawable: level2 },
        },
        { new: true, runValidators: false }
      ).lean().exec();

      if (updatedParent) {
        result.parentAffiliate = {
          id: updatedParent._id,
          code: updatedParent.code,
          level2CommissionAdded: level2,
          totalCommission: updatedParent.totalCommission + level2,
          withdrawable: updatedParent.withdrawable + level2,
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
    const aff = await this.affiliateModel.findById(affiliateId);
    if (!aff || aff.withdrawable < amount) throw new Error('Insufficient balance');
    aff.withdrawable -= amount;
    await aff.save();
    return { message: 'Withdraw successful', remaining: aff.withdrawable };
  }
  async getAffiliateStats(userId: string) {
    return this.affiliateModel.findOne({ userId });
  }

  async getSubAffiliates(parentId: string) {
    return this.affiliateModel.find({ parentAffiliateId: parentId });
  }
}
