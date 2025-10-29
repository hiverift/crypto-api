
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Kyc } from './schemas/kyc.schema';
import { Model } from 'mongoose';
@Injectable()
export class KycService {
  constructor(@InjectModel(Kyc.name) private model: Model<Kyc>) {}
  async submit(userId:string, docs:any){ return this.model.findOneAndUpdate({ user:userId }, { user:userId, documents:docs, status:'PENDING' }, { upsert:true, new:true }); }
  async adminSetStatus(id:string, status:string, notes?:string){ return this.model.findByIdAndUpdate(id, { status, notes }, { new:true }); }
  async getForUser(userId:string){ return this.model.findOne({ user:userId }); }
}
