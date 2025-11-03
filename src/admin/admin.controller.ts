import { Controller, Get, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  // ✅ Get all affiliates
  @Get('affiliates')
  async getAllAffiliates() {
    return this.service.getAllAffiliates();
  }

  // ✅ Get all affiliates’ transactions summary
  @Get('affiliate/transactions')
  async getTransactions() {
    return this.service.getTransactions();
  }

  // ✅ Get details for a specific affiliate (by affiliate ID)
  @Get('affiliate/:id')
  async getAffiliateDetails(@Param('id') id: string) {
    return this.service.getAffiliateDetails(id);
  }

  // ✅ Get affiliate dashboard (by user ID)
  @Get('dashboard/:userId')
  async getAffiliateDashboard(@Param('userId') userId: string) {
    return this.service.getAffiliateDashboard(userId);
  }
}
