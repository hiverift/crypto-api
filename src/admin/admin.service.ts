import { Injectable,NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Affiliate } from '../affiliate/schemas/affiliate.schema';
import { AffiliateUser } from 'src/affiliate-auth/entities/affiliate-auth.entity';
import CustomResponse from 'src/providers/custom-response.service';
@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Affiliate.name) private affiliates: Model<Affiliate>,
    @InjectModel(AffiliateUser.name) private users: Model<AffiliateUser>,
  ) {}

  async getAllAffiliates() {
    return this.affiliates.find();
  }

 async getAffiliateDetails(id: string) {
  const affiliate = await this.affiliates.findById(id);
  if (!affiliate) throw new Error('Affiliate not found');

  const user = await this.users
    .findById(affiliate.userId)
    .select('0-password')
    .lean();

  return { affiliate, user };
 }

  async getTransactions() {
    const affiliates = await this.affiliates.find();
    return affiliates.map(a => ({
      code: a.code,
      totalCommission: a.totalCommission,
      withdrawable: a.withdrawable,
    
    }));
  }
   async getAffiliateDashboard(id: string) {
    console.log(id,"uijijijiij")
    const affiliate = await this.affiliates.findOne({ userId: id }).lean();
        console.log(affiliate,"uijijijiij")
    if (!affiliate) {   
      throw new NotFoundException('Affiliate not found');
    }


    const totalReferrals = affiliate.totalReferrals;
    const totalCommission = affiliate.totalCommission;
    const withdrawable = affiliate.withdrawable;
    const totalReferralRegistered = affiliate.referredUsers.length;

    return {
      userId: affiliate.userId,
      code: affiliate.code,
      parentAffiliateId: affiliate.parentAffiliateId,
      totalCommission,
      withdrawable,
      totalReferrals,
      totalReferralRegistered,
      referredUsers: affiliate.referredUsers,
    };
  }

}
