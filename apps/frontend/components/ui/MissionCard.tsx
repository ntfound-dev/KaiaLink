'use client';

import React, { FC } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CheckCircle, ExternalLink } from 'lucide-react';
import type { Mission } from '@/types/shared';

interface MissionCardProps {
  mission: Mission;
  onActionClick: (mission: Mission) => void;
  isVerifying: boolean;
}

export const MissionCard: FC<MissionCardProps> = ({ mission, onActionClick, isVerifying }) => {
  return (
    <Card className="flex flex-col justify-between rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{mission.title}</CardTitle>
      </CardHeader>

      <CardContent>
        {mission.description && <p className="mb-4 text-sm text-gray-600">{mission.description}</p>}

        <div className="flex items-center justify-between">
          <span className="font-semibold text-blue-600">+{mission.points ?? 0} Poin</span>

          {mission.status === 'completed' ? (
            <span className="flex items-center text-green-600 text-sm">
              <CheckCircle className="mr-1 h-4 w-4" /> Selesai
            </span>
          ) : (
            <button
              onClick={() => onActionClick(mission)}
              disabled={isVerifying}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {isVerifying ? 'Memproses...' : mission.actionUrl ? <><ExternalLink className="h-4 w-4" /> Kerjakan</> : 'Kerjakan'}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MissionCard;
