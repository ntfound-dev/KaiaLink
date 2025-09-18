// LOKASI FILE: apps/backend/src/prisma/seed.ts

import { PrismaClient, MissionType } from '@prisma/client';

const prisma = new PrismaClient();

// PENYEMPURNAAN: Gunakan konstanta untuk tipe leaderboard agar konsisten
const LeaderboardType = {
  POINTS: 'POINTS',
  SWAP_VOLUME: 'SWAP_VOLUME',
  STAKING_VOLUME: 'STAKING_VOLUME',
  AMM_VOLUME: 'AMM_VOLUME',
  LENDING_VOLUME: 'LENDING_VOLUME',
  REFERRAL_COUNT: 'REFERRAL_COUNT',
};

async function main() {
  console.log('Start seeding...');

  // --- MEMBERSIHKAN DATA LAMA ---
  await prisma.leaderboardEntry.deleteMany({});
  await prisma.leaderboard.deleteMany({});
  await prisma.completedMission.deleteMany({});
  await prisma.mission.deleteMany({});

  // --- MEMBUAT DEFINISI LEADERBOARD ---
  console.log('Creating leaderboards...');
  await prisma.leaderboard.createMany({
    data: [
      { name: 'Poin Global', description: 'Peringkat semua pengguna berdasarkan total poin.', type: LeaderboardType.POINTS, resetCycle: 'WEEKLY' },
      { name: 'Volume Swap Mingguan', description: 'Total volume swap pengguna dalam seminggu.', type: LeaderboardType.SWAP_VOLUME, resetCycle: 'WEEKLY' },
      { name: 'Volume Staking Global', description: 'Total nilai aset yang di-stake oleh pengguna.', type: LeaderboardType.STAKING_VOLUME, resetCycle: 'WEEKLY' },
      { name: 'Volume AMM Global', description: 'Total nilai likuiditas yang ditambahkan pengguna.', type: LeaderboardType.AMM_VOLUME, resetCycle: 'WEEKLY' },
      { name: 'Volume Lending Global', description: 'Total nilai aset yang dipinjamkan pengguna.', type: LeaderboardType.LENDING_VOLUME, resetCycle: 'WEEKLY' },
      { name: 'Referral Terbanyak', description: 'Pengguna dengan referral sukses terbanyak.', type: LeaderboardType.REFERRAL_COUNT, resetCycle: 'WEEKLY' },
    ],
  });
  console.log('Leaderboards created.');

  // --- MEMBUAT CONTOH MISI (DENGAN TIPE & TARGET YANG BENAR) ---
  console.log('Creating sample missions...');
  await prisma.mission.createMany({
    data: [
      {
        title: 'Lakukan Swap Senilai $10',
        description: 'Lakukan pertukaran token apa pun dengan volume minimal $10.',
        points: 100,
        // PENYEMPURNAAN: Gunakan enum dari Prisma Client
        type: MissionType.SWAP_VOLUME,
        // PENYEMPURNAAN: Simpan nilai target di kolom terpisah
        targetId: '10', // targetId bisa kita gunakan untuk menyimpan nilai ini
        isActive: true,
      },
      {
        title: 'Stake Aset Senilai $50',
        description: 'Stake aset senilai minimal $50 di salah satu pool kami.',
        points: 150,
        type: MissionType.STAKE_VOLUME,
        targetId: '50',
        isActive: true,
      },
      {
        title: 'Ajak 1 Teman',
        description: 'Undang satu teman untuk bergabung menggunakan kode referral Anda.',
        points: 200,
        type: MissionType.REFER_FRIEND,
        targetId: '1',
        isActive: true,
      },
      {
        title: 'Gabung ke Discord Kami',
        description: 'Bergabung dengan server Discord resmi KaiaLink.',
        points: 50,
        type: MissionType.JOIN_DISCORD_SERVER,
        targetId: 'ID_SERVER_DISCORD_ANDA', // Simpan ID server di sini
        isActive: true,
      }
    ],
    skipDuplicates: true, // Mencegah error jika data sudah ada
  });
  console.log('Missions created.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });