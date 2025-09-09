// File: apps/backend/src/common/dtos/update-user.dto.ts
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Handle Telegram baru pengguna.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  telegramHandle?: string;

  @ApiPropertyOptional({ description: 'ID Discord baru pengguna.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  discordId?: string;

  @ApiPropertyOptional({ description: 'Handle Twitter baru pengguna.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  twitterHandle?: string;

  @ApiPropertyOptional({ description: 'ID Line baru pengguna.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lineId?: string;
}