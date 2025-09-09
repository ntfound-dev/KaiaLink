import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';

@Injectable()
export class MissionsService {
  private readonly logger = new Logger(MissionsService.name);
  private readonly referralCommissionRate: number;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Ambil rate komisi dari file .env
    this.referralCommissionRate = parseFloat(
      this.configService.get<string>('REFERRAL_COMMISSION_RATE', '0.1'), // Default 10%
    );
  }

  // --- FUNGSI-FUNGSI CRUD UNTUK ADMIN (DENGAN PENGECEKAN) ---
  create(createMissionDto: CreateMissionDto) {
    return this.prisma.mission.create({ data: createMissionDto });
  }

  findAll() {
    return this.prisma.mission.findMany({ where: { isActive: true } });
  }

  async findOne(id: number) {
    const mission = await this.prisma.mission.findUnique({ where: { id } });
    if (!mission) {
      throw new NotFoundException(`Misi dengan ID "${id}" tidak ditemukan.`);
    }
    return mission;
  }

  async update(id: number, updateMissionDto: UpdateMissionDto) {
    await this.findOne(id); // Cek dulu apakah misinya ada
    return this.prisma.mission.update({
      where: { id },
      data: updateMissionDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Cek dulu apakah misinya ada
    await this.prisma.mission.delete({ where: { id } });
    return { message: `Misi dengan ID ${id} berhasil dihapus` };
  }
  
  // --- LOGIKA INTI UNTUK PENGGUNA ---
  
  async completeMission(userId: string, missionId: number): Promise<any> {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!mission || !user) {
      throw new NotFoundException('Misi atau pengguna tidak ditemukan.');
    }
    
    // ... (Logika verifikasi misi yang sebenarnya akan ada di sini) ...
    const isVerified = true; // Asumsikan misi berhasil diverifikasi untuk tujuan tes

    if (isVerified) {
      return this.prisma.$transaction(async (tx) => {
        const awardedPoints = mission.points;

        // 1. Beri poin ke pengguna yang menyelesaikan misi
        await tx.user.update({
          where: { id: userId },
          data: { points: { increment: awardedPoints } },
        });

        // =================================================================
        // ▼▼▼▼▼▼▼▼▼▼▼▼▼ KODE BONUS REFERRAL BERKELANJUTAN ▼▼▼▼▼▼▼▼▼▼▼▼▼
        // =================================================================
        
        // 2. Cek apakah pengguna ini diundang oleh seseorang
        if (user.referredById) {
          const commissionPoints = Math.floor(awardedPoints * this.referralCommissionRate);
          
          if (commissionPoints > 0) {
            // Jika ya, tambahkan poin komisi ke pengundangnya (referrer)
            await tx.user.update({
              where: { id: user.referredById },
              data: { points: { increment: commissionPoints } },
            });
            this.logger.log(`Memberikan ${commissionPoints} poin komisi ke referrer ${user.referredById}`);
          }
        }
        
        // =================================================================
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        // =================================================================

        // 3. Tandai misi selesai agar tidak bisa diklaim lagi
        await tx.completedMission.create({
          data: { userId, missionId },
        });

        return {
          success: true,
          message: `Misi selesai! Anda mendapatkan ${awardedPoints} poin.`,
        };
      });
    } else {
      throw new BadRequestException('Syarat misi belum terpenuhi.');
    }
  }
}

