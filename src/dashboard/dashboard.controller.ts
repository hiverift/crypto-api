import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  // 📊 Get full analytics
  @Get()
  async getDashboard(@CurrentUser() user: any) {
    return this.dashboard.getFullDashboard(user.sub);
  }

  // Individual endpoints if needed
  @Get('portfolio')
  async getPortfolio(@CurrentUser() user: any) {
    return this.dashboard.getPortfolio(user.sub);
  }

  @Get('pnl')
  async getPnL(@CurrentUser() user: any) {
    return this.dashboard.getPnL(user.sub);
  }

  @Get('fees')
  async getFees(@CurrentUser() user: any) {
    return this.dashboard.getFeeSummary(user.sub);
  }

  @Get('affiliate')
  async getAffiliate(@CurrentUser() user: any) {
    return this.dashboard.getAffiliateEarnings(user.sub);
  }
}
