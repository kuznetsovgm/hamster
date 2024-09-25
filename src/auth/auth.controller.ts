import { Controller, Post, HttpCode, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginTokenDto } from './dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login-token')
  @HttpCode(200)
  async login() {
    return await this.authService.createLoginToken();
  }

  @Post('check-login')
  @HttpCode(200)
  async checkLogin(@Body() body: LoginTokenDto) {
    return this.authService.checkLogin(body.loginToken);
  }

  @Post('check-login-long')
  @HttpCode(200)
  async checkLoginLong(@Body() body: LoginTokenDto) {
    return this.authService.checkLoginLong(body.loginToken);
  }
}
