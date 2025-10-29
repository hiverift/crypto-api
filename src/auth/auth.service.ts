import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async register(dto: any) {
    // users.create may return a mongoose document; casting to any to access _id safely
    const u: any = await this.users.create(dto);
    return this.sign(u._id.toString(), u.email);
  }

  async login(dto: { email: string; password: string }) {
    const user: any = await this.users.findByEmail(dto.email, true);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.sign(user._id.toString(), user.email);
  }

  private sign(sub: string, email: string) {
    const access_token = this.jwt.sign({ sub, email });
    return { access_token, token_type: 'Bearer' };
  }
}
