import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const isProd = process.env.NODE_ENV === 'production';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { tokens, user } = await this.authService.login(dto.email, dto.password);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    const tokens = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { ok: true };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user?.id);
    res.clearCookie('access_token', COOKIE_OPTS);
    res.clearCookie('refresh_token', COOKIE_OPTS);
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUser() user: any) {
    return { user };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
      ...COOKIE_OPTS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      ...COOKIE_OPTS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
