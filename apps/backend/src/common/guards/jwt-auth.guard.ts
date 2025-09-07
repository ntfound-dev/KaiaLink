// LOKASI FILE: apps/backend/src/common/guards/jwt-auth.guard.ts
// -------------------------------------------------------------

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard ini menggunakan 'jwt' strategy yang telah kita definisikan
 * di auth/strategies/jwt.strategy.ts.
 * Setiap rute yang menggunakan @UseGuards(JwtAuthGuard) akan otomatis
 * dilindungi dan memerlukan Bearer Token yang valid.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

