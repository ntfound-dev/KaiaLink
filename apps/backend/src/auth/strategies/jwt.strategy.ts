// LOKASI FILE: apps/backend/src/auth/strategies/jwt.strategy.ts
// -------------------------------------------------------------

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // Cara mengekstrak token: dari header 'Authorization' sebagai 'Bearer' token.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Jangan abaikan jika token sudah kadaluarsa.
      ignoreExpiration: false,
      // Kunci rahasia untuk memverifikasi tanda tangan token.
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Fungsi ini akan dipanggil setelah token berhasil diverifikasi.
   * Payload yang dikembalikan akan ditambahkan oleh NestJS ke object Request (req.user).
   * @param payload Payload yang ada di dalam JWT
   * @returns Objek yang akan menjadi req.user
   */
  async validate(payload: any) {
    return { userId: payload.sub, walletAddress: payload.walletAddress };
  }
}

