import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Affiliate, AffiliateSchema } from '../affiliate/schemas/affiliate.schema';
import { AffiliateUser,AffiliateUserSchema } from 'src/affiliate-auth/entities/affiliate-auth.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Affiliate.name, schema: AffiliateSchema },
      { name: AffiliateUser.name, schema: AffiliateUserSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
