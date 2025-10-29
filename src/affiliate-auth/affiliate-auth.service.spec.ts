import { Test, TestingModule } from '@nestjs/testing';
import { AffiliateAuthService } from './affiliate-auth.service';

describe('AffiliateAuthService', () => {
  let service: AffiliateAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AffiliateAuthService],
    }).compile();

    service = module.get<AffiliateAuthService>(AffiliateAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
