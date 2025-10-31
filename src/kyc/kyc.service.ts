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

  async submit(userId: string, docs: any) {
    try {
      if (!userId || !docs) throw new CustomError(400, 'User ID and documents are required');

      const kyc = await this.model.findOneAndUpdate(
        { user: userId },
        { user: userId, documents: docs, status: 'PENDING' },
        { upsert: true, new: true },
      );

      return new CustomResponse(200, 'KYC updated successfully', kyc);
    } catch (error: any) {
      throwException(error);
    }
  }

  async adminSetStatus(id: string, status: string, notes?: string) {
    try {
      if (!id || !status) throw new CustomError(400, 'KYC ID and status are required');

      const updated = await this.model.findByIdAndUpdate(
        id,
        { status, notes },
        { new: true },
      );

      if (!updated) throw new CustomError(404, 'KYC record not found');

      return new CustomResponse(
        200,
        `KYC ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`,
        updated
      );
    } catch (error: any) {
      throwException(error);
    }
  }

  async getForUser(userId: string) {
    try {
      if (!userId) throw new CustomError(400, 'User ID is required');

      const kyc = await this.model.findOne({ user: userId });
      if (!kyc) throw new CustomError(404, 'KYC record not found');

      return new CustomResponse(200, 'KYC details fetched successfully', kyc);
    } catch (error: any) {
      throwException(error);
    }
  }
}
