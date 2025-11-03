
import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { OrdersService } from './orders.service';
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService){}
  @Post() place(@CurrentUser() user:any, @Body() dto:any){ return this.orders.placeOrder(user.sub, dto); }


  
}
