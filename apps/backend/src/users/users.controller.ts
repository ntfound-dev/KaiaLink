// LOKASI FILE: apps/backend/src/users/users.controller.ts
// -------------------------------------------------------

import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('users') // Mengelompokkan endpoint di dokumentasi Swagger
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Endpoint untuk mendapatkan profil pengguna yang sedang login.
   * Rute ini dilindungi oleh JwtAuthGuard.
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // Menandakan endpoint ini butuh Bearer Token di Swagger
  @Get('profile')
  getProfile(@Request() req) {
    // req.user berisi payload dari JWT yang sudah divalidasi oleh JwtStrategy
    // Kita panggil service untuk mengambil data lengkap dari database
    return this.usersService.getProfile(req.user.userId);
  }
}

