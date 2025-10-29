
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [forwardRef(()=>UsersModule), JwtModule.register({ secret: process.env.JWT_SECRET||'dev', signOptions:{ expiresIn:'7d' } })],
  providers:[AuthService, JwtStrategy],
  controllers:[AuthController],
  exports:[AuthService],
})
export class AuthModule {}
