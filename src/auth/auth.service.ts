import { Injectable } from '@nestjs/common';
import { Payload } from 'src/types/payload';
import { sign } from 'jsonwebtoken';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    // private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signPayload(payload: Payload) {
    // return sign(payload, 'kimkim', { expiresIn: '24h' });
    return this.jwtService.sign(payload);
  }
  
  async validateUser(payload: Payload) {
    // const user = await this.userService.findByPayload(payload);
    // if (user) {
    //   return user;
    // }
    return null;
  }
}
