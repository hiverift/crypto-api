import { Controller, Get, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('affiliates')
  getAll() {
    return this.service.getAllAffiliates();
  }
  
  @Get('affiliate/transactions')
  getTransactions() {
    return this.service.getTransactions();
  }

  @Get('affiliate/:id')
  getDetails(@Param('id') id: string) {
    return this.service.getAffiliateDetails(id);
  }

  @Get('AllDashboardDetails/:id')
  getAffiliateDashboard(@Param('id') id: string) {
    return this.service.getAffiliateDashboard(id);
  }

}
