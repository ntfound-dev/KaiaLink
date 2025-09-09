import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO (Data Transfer Object) untuk memvalidasi data saat pengguna mengupdate profil mereka.
 * Menggunakan @IsOptional() berarti pengguna tidak harus mengirim semua field,
 * mereka bisa mengirim hanya field yang ingin diubah.
 */
export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Handle Telegram pengguna', example: '@kaialink' })
  telegramHandle?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'ID Discord pengguna', example: '123456789012345678' })
  discordId?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Handle X (Twitter) pengguna', example: '@kaialink_io' })
  twitterHandle?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'ID Line pengguna', example: 'uline12345' })
  lineId?: string;
}
