// src/affiliate/affiliate.controller.ts
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { CreateAffiliateDto } from './dto/create-affiliate.dto';

@Controller('affiliate')
export class AffiliateController {
  constructor(private affiliateService: AffiliateService) {}

  @Post('register')
  async register(@Body() dto: CreateAffiliateDto) {
    return this.affiliateService.createAffiliate(dto);
  }

  @Get(':userId/stats')
  async getStats(@Param('userId') userId: string) {
    return this.affiliateService.getAffiliateStats(userId);
  }

  @Get(':code')
  async getByCode(@Param('code') code: string) {
    return this.affiliateService.getAffiliateByCode(code);
  }

  @Post(':affiliateId/commission')
  async addCommission(
    @Param('affiliateId') affiliateId: string,
    @Body('amount') amount: number,
  ) {
    return this.affiliateService.addCommission(affiliateId, amount);
  }

  @Get(':affiliateId/subs')
  async getSubs(@Param('affiliateId') affiliateId: string) {
    return this.affiliateService.getSubAffiliates(affiliateId);
  }
   @Post(':affiliateId/withdraw')
  withdraw(@Param('affiliateId') id: string, @Body('amount') amount: number) {
    return this.affiliateService.withdraw(id, amount);
  }
}
