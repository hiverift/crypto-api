
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  async create(dto: any) {
    const hash = await bcrypt.hash(dto.password, 10);
    return this.userModel.create({ ...dto, password: hash });
  }
  async findByEmail(email: string, withPassword = false) {
    const q = this.userModel.findOne({ email });
    return withPassword ? q.select('+password') : q;
  }
  async findById(id: string) {
    const u = await this.userModel.findById(id);
    if(!u) throw new NotFoundException('User not found');
    return u;
  }
  async setReferral(userId: string, refBy?: string) {
    return this.userModel.findByIdAndUpdate(userId, { referredBy: refBy }, { new: true });
  }
}
