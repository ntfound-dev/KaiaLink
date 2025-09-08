// LOKASI FILE: apps/backend/src/users/users.controller.ts
// -------------------------------------------------------

import { Controller, Get, Post, Request, UseGuards, Redirect } from '@nestjs/common';
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

@ApiTags('me')
@Controller('me')
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Endpoint untuk mendapatkan profil pengguna yang sedang login.
   * Ini adalah alias untuk /users/profile yang mengikuti konvensi REST API.
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  getMyProfile(@Request() req) {
    return this.usersService.getProfile(req.user.userId);
  }
}
