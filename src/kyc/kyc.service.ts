import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Kyc } from './schemas/kyc.schema';
import { Model } from 'mongoose';
import CustomError from 'src/providers/customer-error.service';
import CustomResponse from 'src/providers/custom-response.service';
import { throwException } from 'src/util/errorhandling';

@Injectable()
export class KycService {
  constructor(@InjectModel(Kyc.name) private model: Model<Kyc>) {}

  // ✅ Submit or update KYC documents
  async submit(userId: string, docs: any) {
    try {
      if (!userId || !docs) throw new BadRequestException('User ID and documents are required');

      const kyc = await this.model.findOneAndUpdate(
        { user: userId },
        { user: userId, documents: docs, status: 'PENDING' },
        { upsert: true, new: true },
      );

      throw  new CustomResponse(200,"kyc update successfully",kyc)
    } catch (error) {
     throwException(error)
    }
  }

  async adminSetStatus(id: string, status: string, notes?: string) {
    try {
      if (!id || !status) throw new BadRequestException('KYC ID and status are required');

      const updated = await this.model.findByIdAndUpdate(
        id,
        { status, notes },
        { new: true },
      );

      if (!updated) throw new NotFoundException('KYC record not found');

      return {
        success: true,
        message: `KYC ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`,
        data: updated,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update KYC status',
        data: null,
        error: error.message,
      };
    }
  }

  // ✅ Get KYC details for a specific user
  async getForUser(userId: string) {
    try {
      if (!userId) throw new BadRequestException('User ID is required');

      const kyc = await this.model.findOne({ user: userId });
      if (!kyc) throw new NotFoundException('KYC record not found');

      return {
        success: true,
        message: 'KYC details fetched successfully',
        data: kyc,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch KYC details',
        data: null,
        error: error.message,
      };
    }
  }
}
