import { Test, TestingModule } from '@nestjs/testing';
import { AffiliateAuthController } from './affiliate-auth.controller';
import { AffiliateAuthService } from './affiliate-auth.service';

describe('AffiliateAuthController', () => {
  let controller: AffiliateAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AffiliateAuthController],
      providers: [AffiliateAuthService],
    }).compile();

    controller = module.get<AffiliateAuthController>(AffiliateAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
