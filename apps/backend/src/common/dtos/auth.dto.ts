// LOKASI FILE: apps/backend/src/common/dtos/auth.dto.ts
import { IsNotEmpty, IsString, IsEthereumAddress } from 'class-validator';

export class SignInDto {
  @IsNotEmpty({ message: 'walletAddress tidak boleh kosong.' })
  @IsString({ message: 'walletAddress harus berupa string.' })
  @IsEthereumAddress({ message: 'Format walletAddress tidak valid.' })
  walletAddress: string;
}

export class VerifyDto {
  @IsNotEmpty({ message: 'walletAddress tidak boleh kosong.' })
  @IsString({ message: 'walletAddress harus berupa string.' })
  @IsEthereumAddress({ message: 'Format walletAddress tidak valid.' })
  walletAddress: string;

  @IsNotEmpty({ message: 'signature tidak boleh kosong.' })
  @IsString({ message: 'signature harus berupa string.' })
  signature: string;
}