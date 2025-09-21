'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import styles from '@/styles/home.module.css';
import { Award, Trophy, Medal } from 'lucide-react';
import type { Profile } from '@/types/shared';

export function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card className={styles.statCard}>
      <div className={styles.statLeft}>
        <div className={styles.iconWrap}>{icon}</div>
        <div>
          <div className={styles.statLabel}>{label}</div>
          <div className={styles.statValue}>{value}</div>
        </div>
      </div>
    </Card>
  );
}

export default function HomeStats({ profile }: { profile?: Profile | null }) {
  const points = Number(profile?.points ?? 0);
  const pointsDisplay = Number.isFinite(points) ? points.toLocaleString() : '0';
  const rankDisplay = profile?.rank != null ? String(profile.rank) : 'N/A';
  const levelDisplay = profile?.level ?? 'Bronze';

  return (
    <div className={styles.statsGrid}>
      <StatCard icon={<Award className="h-8 w-8 text-blue-600" />} label="Total Poin" value={<span className="text-2xl font-bold">{pointsDisplay}</span>} />
      <StatCard icon={<Trophy className="h-8 w-8 text-green-600" />} label="Peringkat Global" value={<span className="text-2xl font-bold">#{rankDisplay}</span>} />
      <StatCard icon={<Medal className="h-8 w-8 text-purple-600" />} label="Level Saat Ini" value={<span className="text-2xl font-bold">{levelDisplay}</span>} />
    </div>
  );
}
