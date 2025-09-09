// LOKASI FILE: apps/backend/src/missions/dto/update-mission.dto.ts
// -----------------------------------------------------------------
import { PartialType } from '@nestjs/swagger';
import { CreateMissionDto } from './create-mission.dto';

// PartialType akan membuat semua properti dari CreateMissionDto menjadi opsional.
// Ini sempurna untuk operasi PATCH/UPDATE di mana pengguna mungkin hanya ingin mengubah satu field.
export class UpdateMissionDto extends PartialType(CreateMissionDto) {}

