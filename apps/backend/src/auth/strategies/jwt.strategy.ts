import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // Ambil user dari DB & return object minimal yang aman dipakai oleh controller
  async validate(payload: any) {
    // Cek payload.sub dulu (bisa berisi id), fallback by walletAddress
    const byId =
      typeof payload.sub === 'string' ? await this.usersService.findById(payload.sub) : null;
    const byWallet =
      !byId && payload.walletAddress ? await this.usersService.findByWallet(payload.walletAddress) : null;
    const user = byId ?? byWallet;

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Kembalikan hanya properti yang memang ada di model User
    return {
      id: user.id,
      walletAddress: user.walletAddress,
      twitterHandle: user.twitterHandle ?? null,
      telegramHandle: user.telegramHandle ?? null,
      discordId: user.discordId ?? null,
      lineId: user.lineId ?? null,
      points: user.points ?? 0,
    };
  }
}
