import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(){
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'dev',
    });
    console.log('[JwtStrategy] constructed');
  }

  async validate(payload: any) {
    console.log('[JwtStrategy] validate called payload=', payload);
    // return shape that becomes req.user
    return { sub: payload.sub, email: payload.email, role: payload.role };
  }
}
