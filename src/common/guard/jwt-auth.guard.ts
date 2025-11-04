import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private jwtService: JwtService) {
    super();
  }

  async canActivate(context: any): Promise<boolean> {
    console.log('vivivvivivivivivivivivivivivi')
    const req = context.switchToHttp().getRequest();
    const token = req.headers.authorization?.split(' ')[1];
    console.log(token)
    if (!token) return false;
    try {
      console.log('vivivvivivivivivivivivivivivi',process.env.JWT_ACCESS_SECRET)
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      console.log('hii chore')
      req.user = decoded;
      return true;
    } catch {
      console.log('vivivvivivivivivivivivivivivi')
      return false;
      
    }
  }
}
