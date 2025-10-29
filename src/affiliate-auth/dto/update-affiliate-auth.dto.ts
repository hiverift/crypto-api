import { PartialType } from '@nestjs/mapped-types';
import { CreateAffiliateAuthDto } from './create-affiliate-auth.dto';

export class UpdateAffiliateAuthDto extends PartialType(CreateAffiliateAuthDto) {}
