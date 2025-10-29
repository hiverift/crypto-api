import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AffiliateAuthService } from './affiliate-auth.service';
import { AffiliateAuthController } from './affiliate-auth.controller';
import { AffiliateUser, AffiliateUserSchema } from './entities/affiliate-auth.entity';
import { Affiliate, AffiliateSchema } from 'src/affiliate/schemas/affiliate.schema';
import { AffiliateModule } from 'src/affiliate/affiliate.module'; // ✅ Added import

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: AffiliateUser.name, schema: AffiliateUserSchema },
      { name: Affiliate.name, schema: AffiliateSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'supersecret', 
        signOptions: { expiresIn: '7d' },
      }),
    }),
    AffiliateModule, 
  ],
  controllers: [AffiliateAuthController],
  providers: [AffiliateAuthService],
  exports: [AffiliateAuthService],
})
export class AffiliateAuthModule {}
