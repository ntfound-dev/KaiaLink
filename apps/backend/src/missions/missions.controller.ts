// LOKASI FILE: apps/backend/src/missions/missions.controller.ts
// --- GANTI SELURUH ISI FILE DENGAN KODE DI BAWAH INI ---
// ----------------------------------------------------------
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MissionsService } from './missions.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('missions-admin') // Tag terpisah untuk manajemen misi
@Controller('missions')
@UseGuards(JwtAuthGuard) // Melindungi semua endpoint ini
@ApiBearerAuth()
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  // Endpoint untuk MENGIRIM / MEMBUAT misi baru
  @Post()
  @ApiOperation({ summary: 'Membuat misi baru' })
  create(@Body() createMissionDto: CreateMissionDto) {
    return this.missionsService.create(createMissionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Mendapatkan semua misi yang ada' })
  findAll() {
    return this.missionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan detail satu misi berdasarkan ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.missionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Memperbarui data misi yang ada' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMissionDto: UpdateMissionDto) {
    return this.missionsService.update(id, updateMissionDto);
  }

  // Endpoint untuk MENGHAPUS misi
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Menghapus misi dari database' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.missionsService.remove(id);
  }
}

