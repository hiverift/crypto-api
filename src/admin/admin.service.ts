import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Affiliate } from '../affiliate/schemas/affiliate.schema';
import { AffiliateUser } from 'src/affiliate-auth/entities/affiliate-auth.entity';

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
    .select('-password')
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
}
