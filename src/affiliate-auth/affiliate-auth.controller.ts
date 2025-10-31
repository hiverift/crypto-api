import { Controller, Post, Body,Put,Query, Get, Req, Param,UseGuards } from '@nestjs/common';
import { AffiliateAuthService } from './affiliate-auth.service';
import { CurrentUser } from 'src/common/current-user.decorator';

@Controller('affiliate/auth')
export class AffiliateAuthController {
  constructor(private service: AffiliateAuthService) { }

  // @Post('register')
  // register(@Body() body: { name: string; email: string; password: string; ref?: string  }) {
  //   return this.service.register(body.name, body.email, body.password);
  // }

  //  @Post('registerAffiliateWithReferal')
  // registerAffiliate(@Body() body: { name: string; email: string; password: string; ref?: string  }) {
  //   return this.service.registerAffiliate(body.name, body.email, body.password);
  // }
  @Post('registerAffiliateAccount')
  registerAffiliateAccount(@Body() body: { name: string; email: string; password: string; ref?: string }) {
    return this.service.registerAffiliateAccount(body.name, body.email, body.password);
  }
  @Post('registerUserWithReferral')
  registerUserWithReferral(@Body() body: { name: string; email: string; password: string; ref?: string }) {
    return this.service.registerUserWithReferral(body.name, body.email, body.password, body.ref);
  }
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.service.login(body.email, body.password);
  }


  @Get('profile')
  getProfile(@Req() req) {
    return this.service.getProfile(req.user.sub);
  }

   @Put('updateProfile/:id')
  updateProfile(@Param() id:any, @Body() body: any) {
    console.log(id.id,'reqyest')
    return this.service.updateProfile(id.id, body);
  }

  @Put('updatePassword/:id')
updatePassword(
  @Param('id') userId: string,
  @Body() body: { oldPassword: string; newPassword: string }
) {
  return this.service.updatePassword(userId, body.oldPassword, body.newPassword);
}
}
