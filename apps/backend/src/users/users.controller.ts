import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  UseGuards,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateUserDto } from '../common/dtos/update-user.dto';

@ApiTags('Users & Profile')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users/me → ambil profil lengkap user login
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dapatkan profil lengkap saya (yang sedang login)' })
  async getMyProfile(@Req() req) {
    this.logger.debug(`req.user = ${JSON.stringify(req.user)}`);
    try {
      const userId = req.user?.id ?? req.user?.userId ?? null;
      if (!userId) {
        this.logger.warn('Missing userId in req.user');
        throw new UnauthorizedException('Invalid token payload');
      }
      return await this.usersService.getFullProfile(userId);
    } catch (err) {
      this.logger.error(err?.stack ?? err);
      throw err instanceof UnauthorizedException
        ? err
        : new InternalServerErrorException();
    }
  }

  /**
   * PATCH /users/me → update profil sosial user login
   */
  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profil sosial saya' })
  async updateMyProfile(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    this.logger.debug(`Update profile for userId=${req.user?.id}`);
    try {
      const userId = req.user?.id ?? null;
      if (!userId) {
        throw new UnauthorizedException('Invalid token payload');
      }
      return await this.usersService.updateProfile(userId, updateUserDto);
    } catch (err) {
      this.logger.error(err?.stack ?? err);
      throw err instanceof UnauthorizedException
        ? err
        : new InternalServerErrorException();
    }
  }
}
