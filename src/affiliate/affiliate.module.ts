import { Module,forwardRef  } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Affiliate, AffiliateSchema } from './schemas/affiliate.schema';
import { AffiliateService } from './affiliate.service';
import { WalletsModule } from '../wallets/wallets.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from 'src/users/users.module';
import { AffiliateController } from './affiliate.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Affiliate.name, schema: AffiliateSchema }]),
    forwardRef(() => UsersModule),
    WalletsModule,          
    TransactionsModule,      
  ],
  controllers: [AffiliateController], 
  providers: [AffiliateService],
  exports: [AffiliateService],
})
export class AffiliateModule {}
