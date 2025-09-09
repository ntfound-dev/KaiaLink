/**
 * LOKASI FILE: apps/backend/src/missions/dto/line-login.dto.ts
 * PENJELASAN:
 * File ini ditaruh di dalam sub-folder 'dto' di dalam modul 'auth'.
 * DTO (Data Transfer Object) berfungsi sebagai "formulir" atau "cetakan"
 * untuk data yang kita harapkan datang dari frontend.
 * Dengan decorator seperti `@IsString()`, NestJS akan secara otomatis
 * memvalidasi bahwa data yang masuk sesuai dengan format yang kita inginkan.
 */

import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object (DTO) untuk validasi data masuk
 * dari endpoint login LINE.
 */
export class LineLoginDto {
  @IsString()
  @IsNotEmpty()
  lineUserId: string;

  @IsString()
  @IsNotEmpty()
  username: string;
}

