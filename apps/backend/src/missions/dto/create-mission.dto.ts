import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMissionDto {
  @ApiProperty({
    description: 'Judul misi',
    example: 'Lakukan 5 Kali Swap',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Deskripsi detail dari misi',
    example: 'Capai total 5 kali swap di platform kami untuk mendapatkan hadiah.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Jumlah poin yang didapat setelah menyelesaikan misi',
    example: 100,
  })
  @IsInt()
  @Min(1)
  points: number;
  
  @ApiProperty({
    description: 'Tipe unik untuk identifikasi logika verifikasi misi',
    example: 'SWAP_COUNT_5',
  })
  @IsString()
  @IsNotEmpty()
  type: string;
}

