import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MissionType } from '@prisma/client'; // PENTING: Impor enum dari Prisma

export class CreateMissionDto {
  @ApiProperty({
    description: 'Judul singkat dan jelas untuk misi.',
    example: 'Lakukan 5 Kali Swap',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Deskripsi detail tentang cara menyelesaikan misi.',
    example: 'Capai total 5 kali swap di platform kami untuk mendapatkan hadiah.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Jumlah poin yang didapat setelah menyelesaikan misi.',
    example: 100,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  points: number;

  @ApiProperty({
    description: 'Tipe misi untuk logika verifikasi di backend.',
    enum: MissionType, // Menampilkan pilihan enum di dokumentasi API
    enumName: 'MissionType',
    example: MissionType.SWAP_COUNT_5,
  })
  @IsEnum(MissionType) // Validasi bahwa nilai yang masuk adalah salah satu dari enum
  @IsNotEmpty()
  type: MissionType; // Tipe data diubah dari string menjadi enum MissionType

  @ApiProperty({
    description:
      'ID target opsional (misal: ID tweet, ID server Discord, dll).',
    example: '1824098229842098402',
    required: false,
  })
  @IsString()
  @IsOptional() // Field ini tidak wajib diisi
  targetId?: string;

  @ApiProperty({
    description: 'Tanggal kedaluwarsa misi (format ISO 8601).',
    example: '2025-12-31T23:59:59Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: Date;
}