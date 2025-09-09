import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // --- MEMBERSIHKAN DATA LAMA ---
  // Urutan penghapusan penting untuk menghindari error foreign key
  await prisma.leaderboardEntry.deleteMany({});
  await prisma.leaderboard.deleteMany({});
  await prisma.completedMission.deleteMany({});
  await prisma.mission.deleteMany({});
  // Jangan hapus User atau DeFiProfile agar data testing tetap ada

  // --- MEMBUAT DEFINISI LEADERBOARD ---
  console.log('Creating leaderboards...');
  await prisma.leaderboard.createMany({
    data: [
      // Leaderboard yang sudah ada
      {
        name: 'Poin Global',
        description: 'Peringkat semua pengguna berdasarkan total poin yang dikumpulkan.',
        type: 'POINTS',
        resetCycle: 'WEEKLY',
      },
      {
        name: 'Volume Swap Mingguan',
        description: 'Peringkat pengguna berdasarkan total volume swap dalam seminggu.',
        type: 'SWAP_VOLUME',
        resetCycle: 'WEEKLY',
      },
      // --- LEADERBOARD BARU YANG DITAMBAHKAN ---
      {
        name: 'Volume Staking Global',
        description: 'Total nilai aset yang di-stake oleh pengguna.',
        type: 'STAKING_VOLUME',
        resetCycle: 'WEEKLY',
      },
      {
        name: 'Volume AMM Global',
        description: 'Total nilai likuiditas yang ditambahkan pengguna ke AMM.',
        type: 'AMM_VOLUME',
        resetCycle: 'WEEKLY',
      },
      {
        name: 'Volume Lending Global',
        description: 'Total nilai aset yang dipinjamkan (supply) oleh pengguna.',
        type: 'LENDING_VOLUME',
        resetCycle: 'WEEKLY',
      },
      {
        name: 'Referral Terbanyak',
        description: 'Pengguna dengan jumlah referral sukses terbanyak.',
        type: 'REFERRAL_COUNT',
        resetCycle: 'WEEKLY',
      },
    ],
  });
  console.log('Leaderboards created.');

  // --- MEMBUAT CONTOH MISI ---
  console.log('Creating sample missions...');
  await prisma.mission.createMany({
    data: [
      {
        title: 'Lakukan Swap Pertama Anda',
        description: 'Lakukan pertukaran token apa pun dengan volume minimal $10.',
        points: 100,
        type: 'SWAP_VOLUME_10',
        isActive: true,
      },
      {
        title: 'Stake Aset Anda',
        description: 'Stake aset senilai minimal $50 di salah satu pool kami.',
        points: 150,
        type: 'STAKE_VOLUME_50',
        isActive: true,
      },
      {
        title: 'Ajak 1 Teman',
        description: 'Undang satu teman untuk bergabung menggunakan kode referral Anda.',
        points: 200,
        type: 'REFER_FRIEND_1',
        isActive: true,
      },
    ],
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

