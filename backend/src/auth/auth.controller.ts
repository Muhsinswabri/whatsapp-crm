import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

// Whether the frontend is served from a different origin/domain than this API
// (e.g. Vercel frontend + Render backend). In that case the auth cookies MUST
// be sent with `secure: true; sameSite: 'none'` or the browser will silently
// refuse to store/send them on cross-site fetch requests, which shows up as
// every authenticated call (e.g. GET /api/dashboard/status) returning 401
// even right after a successful login.
//
// We don't rely on NODE_ENV alone here because hosting platforms like Render
// don't always set NODE_ENV=production automatically, and forgetting to set
// it manually silently breaks cross-site auth. Instead we treat the
// deployment as cross-site whenever FRONTEND_ORIGIN is an https:// URL (or
// COOKIE_CROSS_SITE is explicitly set), which is the actual condition that
// determines whether SameSite=None is required.
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const isCrossSite =
  process.env.COOKIE_CROSS_SITE === 'true' ||
  process.env.NODE_ENV === 'production' ||
  frontendOrigin.startsWith('https://');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: isCrossSite,
  sameSite: (isCrossSite ? 'none' : 'lax') as 'none' | 'lax',
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