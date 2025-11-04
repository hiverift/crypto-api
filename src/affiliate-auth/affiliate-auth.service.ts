import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AffiliateUser } from './entities/affiliate-auth.entity';
import { Affiliate } from 'src/affiliate/schemas/affiliate.schema';
import CustomError from 'src/providers/customer-error.service';
import CustomResponse from 'src/providers/custom-response.service';
import { throwException } from 'src/util/errorhandling';

@Injectable()
export class AffiliateAuthService {
  constructor(
    @InjectModel(AffiliateUser.name) private model: Model<AffiliateUser>,
    @InjectModel(Affiliate.name) private AffiliateModel: Model<Affiliate>,
    private jwt: JwtService
  ) {}

  async registerAffiliateAccount(name: string, email: string, password: string) {
    try {
      if (!name || !email || !password) throw new CustomError(400,'All fields required');

      const exists = await this.model.findOne({ email }).exec();
      if (exists) throw new CustomError(409,'Email already registered');

      const hashed = await bcrypt.hash(password, 10);

      const createdUser = await this.model.create({
        name,
        email,
        password: hashed,
        isAdmin: false,
      });

      const code = this.generateReferralCode();

      const createdAffiliate = await this.AffiliateModel.create({
        userId: (createdUser as any)._id,
        code,
        parentAffiliateId: null,
        totalReferrals: 0,
        totalCommission: 0,
        withdrawable: 0,  
        referredUsers: [],
      });

      const userObj = (createdUser as any).toObject ? (createdUser as any).toObject() : createdUser;
      delete userObj.password;

      return new CustomResponse(200,'Affiliate account created', {
        affiliate: {
          id: (createdAffiliate as any)._id,
          code: (createdAffiliate as any).code,
          ownerId: (createdAffiliate as any).userId,
        },
        user: userObj,
      });
    } catch (err: any) {
      throwException(err);
    }
  }

  async registerUserWithReferral(name: string, email: string, password: string, ref?: string) {
    try {
      if (!name || !email || !password) throw new CustomError(400,'All fields required');

      const exists = await this.model.findOne({ email }).exec();
      if (exists) throw new CustomError(409,'Email already registered');

      const hashed = await bcrypt.hash(password, 10);

      const createdUser = await this.model.create({
        name,
        email,
        password: hashed,
        referredByAffiliateId: null,
      });

      if (ref) {
        const affiliate = await this.AffiliateModel.findOne({ code: ref }).exec();
        if (affiliate) {
          const affiliateId = (affiliate as any)._id;

          await this.AffiliateModel.findByIdAndUpdate(
            affiliateId,
            {
              $addToSet: { referredUsers: createdUser._id },
              $inc: { totalReferrals: 1 },
            },
            { new: true }
          ).exec();

          await this.model.updateOne(
            { _id: createdUser._id },
            { $set: { referredByAffiliateId: affiliateId.toString() } }
          ).exec();
        }
      }

      const userObj = (createdUser as any).toObject ? (createdUser as any).toObject() : createdUser;
      if (userObj.password) delete userObj.password;

      return new CustomResponse(200,'User registered successfully', {
        user: userObj,
        referredBy: ref || null,
      });
    } catch (err: any) {
      throwException(err);
    }
  }

  async login(email: string, password: string) {
    try {
      const user = await this.model.findOne({ email });
      if (!user) throw new CustomError(401,'Invalid credentials');

      const match = await bcrypt.compare(password, user.password);
      if (!match) throw new CustomError(401,'Invalid credentials');
      console.log(user.id,email)
      const token = await this.sign(user.id, email);

      const affiliate = await this.AffiliateModel.findOne({ userId: user.id.toString() }).lean().exec();
      const referralCode = affiliate ? affiliate.code : null;

      const userObj = user.toObject ? user.toObject() : user;
      if ('password' in userObj) delete (userObj as any).password;

      return new CustomResponse(200,'Login successful', {
        token,
        user: userObj,
        affiliate: {
          hasAffiliate: !!affiliate,
          code: referralCode,
        },
      });
    } catch (err: any) {
      throwException(err);
    }
  }
  async getProfile(userId: string) {
    try {
      const user = await this.model.findById(userId).select('-password');
      if (!user) throw new CustomError(404,'User not found');
      return new CustomResponse(200,'Profile retrieved', user);
    } catch (err: any) {
      throwException(err);
    }
  }

  async updateProfile(userId: string, updateData: Partial<AffiliateUser>) {
    try {
      if (!userId) throw new CustomError(400,'User ID is required');

      const allowedFields = ['name', 'emailStatus', 'phone', 'country', 'whatsapp', 'telegram', 'link', 'description'];
      const updateObj: any = {};

      for (const key of allowedFields) {
        if (key in updateData) updateObj[key] = updateData[key];
      }

      if (Object.keys(updateObj).length === 0) throw new CustomError(400,'No valid fields provided for update');

      const updatedUser = await this.model.findByIdAndUpdate(userId, updateObj, { new: true }).select('-password');
      if (!updatedUser) throw new CustomError(404,'User not found');

      return new CustomResponse(200,'Profile updated successfully', updatedUser);
    } catch (err: any) {
      throwException(err);
    }
  }

  private async sign(id: string, email: string) {
    return this.jwt.signAsync({ sub: id, email });
  }

  private generateReferralCode(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'AFF';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async updatePassword(userId: string, oldPassword: string, newPassword: string) {
  try {
    if (!oldPassword || !newPassword) {
      throw new CustomError(400, 'Old and new passwords are required');
    }

    const user = await this.model.findById(userId);
    if (!user) throw new CustomError(404, 'User not found');

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) throw new CustomError(401, 'Old password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return new CustomResponse(200, 'Password updated successfully');
  } catch (err: any) {
    throwException(err);
  }
}
}
