// LOKASI FILE: apps/backend/src/missions/missions.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MissionsService {
  constructor(private prisma: PrismaService) {}

  async getActiveMissions() {
    return this.prisma.mission.findMany();
  }

  async getUserMissions(userId: string) {
    const userMissions = await this.prisma.userMission.findMany({
      where: { userId },
      select: {
        missionId: true,
        completedAt: true,
      },
    });

    const userMissionsMap = new Map(
      userMissions.map((um) => [um.missionId, um.completedAt]),
    );

    const allMissions = await this.getActiveMissions();

    return allMissions.map((mission) => ({
      ...mission,
      completed: userMissionsMap.has(mission.id),
      completedAt: userMissionsMap.get(mission.id) || null,
    }));
  }

  async completeMission(userId: string, missionId: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
    });

    if (!mission) {
      throw new NotFoundException('Misi tidak ditemukan.');
    }

    const existingCompletion = await this.prisma.userMission.findUnique({
      where: {
        userId_missionId: {
          userId,
          missionId,
        },
      },
    });

    if (existingCompletion) {
      throw new BadRequestException('Anda sudah menyelesaikan misi ini.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          increment: mission.points,
        },
      },
    });

    const completedMission = await this.prisma.userMission.create({
      data: {
        userId,
        missionId,
      },
    });

    return completedMission;
  }
}