import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';
import CustomError from 'src/providers/customer-error.service';
import CustomResponse from 'src/providers/custom-response.service';
import { throwException } from 'src/util/errorhandling';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  // ----------------- CREATE USER -----------------
  async create(dto: any) {
    try {
      if (!dto.email || !dto.password) {
        throw new CustomError(400,'Email and password are required');
      }

      const existing = await this.userModel.findOne({ email: dto.email });
      if (existing) throw new CustomError(409,'Email already exists');

      const hash = await bcrypt.hash(dto.password, 10);

      const user = await this.userModel.create({
        ...dto,
        password: hash,
        name: dto.name || 'Guest',
        emailStatus: dto.emailStatus || 'Unverified',
        phone: dto.phone || '',
        country: dto.country || '',
        whatsapp: dto.whatsapp || '',
        telegram: dto.telegram || '',
        link: dto.link || '',
        description: dto.description || '',
      });

      return new CustomResponse (200,'User created successfully', user);
    } catch (err: any) {
      throwException(err)
    }
  }

  // ----------------- FIND USER BY EMAIL -----------------
  async findByEmail(email: string, withPassword = false) {
    try {
      const query = this.userModel.findOne({ email });
      const user = withPassword ? await query.select('+password') : await query;
    if (!user) throw new CustomError(404,'User not found');
      return new CustomResponse (200,'User found', user);
    } catch (err: any) {
      throwException(err)
  }
}

  // ----------------- FIND USER BY ID -----------------
  async findById(id: string) {
    try {
      const user = await this.userModel.findById(id);
    if (!user) throw new CustomError(404,'User not found');
      return new CustomResponse(200,'User found', user);
    } catch (err: any) {
     throwException(err)
    }
  }

  // ----------------- SET REFERRAL -----------------
  async setReferral(userId: string, refBy?: string) {
    try {
      const user = await this.userModel.findByIdAndUpdate(
        userId,
        { referredBy: refBy },
        { new: true }
      );
      if (!user) throw new CustomError(404,'User not found');
      return new CustomResponse (200,'Referral set successfully', user);
    } catch (err: any) {
      throwException(err)
    }
  }

  // ----------------- UPDATE USER PROFILE -----------------
  async updateUser(userId: string, updateData: Partial<User>) {
    try {
      if (!userId) throw new CustomError(400,'User ID is required');

      const allowedFields = [
        'name',
        'emailStatus',
        'phone',
        'country',
        'whatsapp',
        'telegram',
        'link',
        'description',
      ];
      const updateObj: any = {};

      for (const key of allowedFields) {
        if (key in updateData) updateObj[key] = updateData[key];
      }

      if (Object.keys(updateObj).length === 0) {
        throw new CustomError(400,'No valid fields provided for update');
      }

      const updatedUser = await this.userModel.findByIdAndUpdate(userId, updateObj, { new: true }).select('-password');
      if (!updatedUser) throw new CustomError(404,'User not found');

      return new CustomResponse (200,'User updated successfully', updatedUser);
    } catch (err: any) {
      throwException(err)
    }
  }
}
