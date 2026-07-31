import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('password hashing', () => {
  it('hashes and verifies correctly, and rejects wrong password', async () => {
    const hash = await bcrypt.hash('CorrectHorse123!', 12);
    expect(await bcrypt.compare('CorrectHorse123!', hash)).toBe(true);
    expect(await bcrypt.compare('WrongPassword', hash)).toBe(false);
  });
});

describe('AuthService token issuance/verification', () => {
  const jwtService = new JwtService({});
  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

  const usersServiceStub = {} as any;
  const auditLogStub = { record: jest.fn() } as any;
  const authService = new AuthService(usersServiceStub, jwtService, auditLogStub);

  it('issues an access token and a refresh token with correct types', () => {
    const tokens = authService.issueTokens('user-1', 'a@b.com', 'ADMIN');
    const access = jwtService.verify(tokens.accessToken, { secret: process.env.JWT_ACCESS_SECRET });
    const refresh = jwtService.verify(tokens.refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
    expect(access.type).toBe('access');
    expect(refresh.type).toBe('refresh');
    expect(access.sub).toBe('user-1');
  });

  it('rejects an invalid refresh token', async () => {
    await expect(authService.refresh('not-a-real-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
