
import { Controller, Post,Get,Param, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { OrdersService } from './orders.service';
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService){}
  @Post() place(@CurrentUser() user:any, @Body() dto:any){ 
    return this.orders.placeOrder(user.sub, dto); 
  }

   @Post('cancel/:id')
  cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.orders.cancelOrder(user.sub, id);
  }

  @Get('my')
  getMyOrders(@CurrentUser() user: any) {
    return this.orders.getUserOrders(user.sub);
  }

  @Get(':id')
  getOrderById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.orders.getOrderById(user.sub, id);
  }


    
}
