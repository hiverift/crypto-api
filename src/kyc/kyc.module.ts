
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Kyc, KycSchema } from './schemas/kyc.schema';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
@Module({
  imports:[MongooseModule.forFeature([{ name: Kyc.name, schema: KycSchema }])],
  providers:[KycService],
  controllers:[KycController],
  exports:[KycService],
})
export class KycModule {}
