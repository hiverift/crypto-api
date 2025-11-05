import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import CustomError from 'src/providers/customer-error.service';
import CustomResponse from 'src/providers/custom-response.service';
import { throwException } from 'src/util/errorhandling';

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async register(dto: any) {
    try {
      const u: any = await this.users.create(dto); 
      const token = await this.sign(u.id.toString(), u.email);

      return new CustomResponse(201, 'User registered successfully', {
        user: u,
        token,
      });
    } catch (err: any) {
      throwException(err);
    }
  }

  async login(dto: { email: string; password: string }) {
    try {
      console.log('email.',dto.email)
      const response: any = await this.users.findByEmail(dto.email, true); 
      const user = response.result; 

      if (!user) throw new CustomError(401, 'Invalid credentials');

      const ok = await bcrypt.compare(dto.password, user.password);
      if (!ok) throw new CustomError(401, 'Invalid credentials');
      console.log('l',user.id)
       const token = await this.sign(user.id, dto.email);

      if ('password' in user) delete user.password;

      return new CustomResponse(200, 'Login successful', {
        user,
        token,
      });
    } catch (err: any) {
      throwException(err);
    }
  }

  private async sign(sub: string, email: string) {
    const access_token = this.jwt.sign({ sub, email });
    return { access_token, token_type: 'Bearer' };
  }
}
