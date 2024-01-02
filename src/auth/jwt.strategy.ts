import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, VerifiedCallback } from 'passport-jwt';
import { Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/enums/roles.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private reflector: Reflector, private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'kimkim',
    });
  }

  async validate(payload: any, done: VerifiedCallback) {
    try {
      const user = await this.authService.validateUser(payload);

      if (!user) {
        throw new HttpException('Unauthorized access', HttpStatus.UNAUTHORIZED);
      }

      // Extract roles from the metadata
      // const roles = this.reflector.get<string[]>('roles', this.constructor);
      // console.log(roles);

      // Check if the user has the required roles
      // if (!roles || roles.some((role: UserRole) => user.roles.includes(role))) {
      return done(null, user, payload.iat);
      // }

      // User does not have the required roles
      // throw new HttpException('Insufficient permissions', HttpStatus.FORBIDDEN);
    } catch (error) {
      return done(error, false);
    }
  }
}
