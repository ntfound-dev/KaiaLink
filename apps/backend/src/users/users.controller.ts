import { Controller, Patch, Body, Request, UseGuards, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateUserDto } from '../common/dtos/update-user.dto';

@ApiTags('users')
@Controller('users') // <-- REVISI: Menambahkan base path 'users' untuk kejelasan
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Endpoint untuk mendapatkan profil pengguna yang sedang login.
   * SEKARANG DIAKSES LEWAT: GET /users/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dapatkan profil saya (pengguna yang sedang login)' })
  async getMyProfile(@Request() req) {
    // req.user.sub adalah 'subject' dari JWT, biasanya berisi user ID
    const userId = req.user.sub; 
    return this.usersService.getProfile(userId);
  }

  /**
   * Endpoint untuk mengupdate profil pengguna yang sedang login.
   * SEKARANG DIAKSES LEWAT: PATCH /users/me
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profil saya (pengguna yang sedang login)' })
  async updateMyProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateUserDto,
  ) {
    const userId = req.user.sub;
    return this.usersService.updateProfile(userId, updateProfileDto);
  }
}
