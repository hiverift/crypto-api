
import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}
  @UseGuards(JwtAuthGuard)
  @Get('me') async me(@CurrentUser() user:any){ return this.users.findById(user.sub); }
}
