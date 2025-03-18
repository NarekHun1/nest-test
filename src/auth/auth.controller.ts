import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpAndInDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: SignUpAndInDto) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: SignUpAndInDto) {
    return this.authService.validateUser(body.email, body.password);
  }
}
