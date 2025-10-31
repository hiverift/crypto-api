import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    return this.users.findById(user.sub);
  }

  @Post()
  async create(@Body() dto: any) {
    return this.users.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('referral')
  async setReferral(@CurrentUser() user: any, @Body() body: { referredBy: string }) {
    return this.users.setReferral(user.sub, body.referredBy);
  }

  
}
