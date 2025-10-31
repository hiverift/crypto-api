import { Controller, Post, UseGuards, Body, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { KycService } from './kyc.service';

@Controller('kyc')
export class KycController {
  constructor(private kyc: KycService) { }

  @UseGuards(JwtAuthGuard)
  @Post('submit')
  async submit(@CurrentUser() user: any, @Body() body: any) {
 
      const result = await this.kyc.submit(user.sub, body.documents);
      return result;
}

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Body() body: any) {
    try {
      const result = await this.kyc.adminSetStatus(
        id,
        body.approve ? 'APPROVED' : 'REJECTED',
        body.notes,
      );
      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update KYC status',
        data: null,
        error: error.message,
      };
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    try {
      const result = await this.kyc.getForUser(user.sub);
      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch KYC details',
        data: null,
        error: error.message,
      };
    }
  }
}
