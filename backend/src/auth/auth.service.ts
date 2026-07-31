import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuditLogService } from '../common/audit-log.service';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private auditLog: AuditLogService,
  ) {}

  async validateCredentials(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Do not reveal whether the email exists.
      throw new UnauthorizedException('Invalid email or password');
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateCredentials(email, password);

    const tokens = this.issueTokens(user.id, user.email, user.role);

    await this.auditLog.record({
      userId: user.id,
      action: 'LOGIN',
      metadata: { email: user.email },
    });

    return {
      tokens,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  issueTokens(userId: string, email: string, role: any) {
    const basePayload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(
      { ...basePayload, type: 'access' } as JwtPayload,
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_TTL || '15m',
      },
    );

    const refreshToken = this.jwtService.sign(
      { ...basePayload, type: 'refresh' } as JwtPayload,
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_TTL || '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(userId: string | undefined) {
    await this.auditLog.record({
      userId: userId ?? null,
      action: 'LOGOUT',
    });
  }
}
