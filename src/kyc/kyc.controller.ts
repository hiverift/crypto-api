
import { Controller, Post, UseGuards, Body, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { KycService } from './kyc.service';

@Controller('kyc')
export class KycController {
  constructor(private kyc: KycService) { }
  @UseGuards(JwtAuthGuard)
  @Post('submit')
  submit(@CurrentUser() user: any, @Body() body: any) {
    return this.kyc.submit(user.sub, body.documents);
  }
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() body: any) {
    return this.kyc.adminSetStatus(id, body.approve ? 'APPROVED' : 'REJECTED', body.notes);
  }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return this.kyc.getForUser(user.sub);
  }
}
