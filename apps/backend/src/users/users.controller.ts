import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateUserDto } from '../common/dtos/update-user.dto';

@ApiTags('Users & Profile') // Mengelompokkan endpoint ini di dokumentasi Swagger
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Endpoint untuk mendapatkan profil LENGKAP milik pengguna yang sedang login.
   * Rute: GET /users/me
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt')) // Melindungi rute dengan otentikasi JWT
  @ApiBearerAuth() // Memberi tahu Swagger bahwa endpoint ini butuh Bearer Token
  @ApiOperation({ summary: 'Dapatkan profil lengkap saya (yang sedang login)' })
  getMyProfile(@Req() req) {
    // req.user.id diisi oleh strategi JWT setelah token divalidasi
    // Pastikan strategi JWT Anda mengembalikan payload dengan properti 'id'
    const userId = req.user.id; 
    
    // MEMANGGIL FUNGSI YANG BENAR: getFullProfile untuk data yang kaya
    return this.usersService.getFullProfile(userId);
  }

  /**
   * Endpoint untuk mengupdate profil pengguna yang sedang login.
   * Rute: PATCH /users/me
   */
  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profil sosial saya' })
  updateMyProfile(
    @Req() req,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userId = req.user.id;
    return this.usersService.updateProfile(userId, updateUserDto);
  }
}