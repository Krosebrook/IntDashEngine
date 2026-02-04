
import React, { useState } from 'react';
import { KPI, User } from '../types';
import { Permissions } from '../lib/permissions';
import KPIEditorModal from './Editor/KPIEditorModal';

interface Props {
  kpi: KPI;
  currentUser: User | null;
  onUpdate?: (updated: KPI) => void;
}

const KPICard: React.FC<Props> = ({ kpi, currentUser, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const isPositive = kpi.trend === 'up';
  const canEdit = Permissions.canEditKPI(currentUser);

  const statusColors = {
    'on-track': 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400',
    'at-risk': 'bg-amber-500/10 border-amber-500/50 text-amber-400',
    'critical': 'bg-rose-500/10 border-rose-500/50 text-rose-400'
  };

  return (
    <div className={`group relative p-5 rounded-xl border ${statusColors[kpi.status]} bg-slate-800/50 flex flex-col justify-between h-32 hover:scale-[1.02] transition-all`}>
      {canEdit && (
        <button 
          onClick={() => setIsEditing(true)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-slate-700/80 hover:bg-slate-600 rounded-lg text-white transition-all shadow-xl"
          title="Edit KPI"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}

      <div className="flex justify-between items-start">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{kpi.label}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
          kpi.status === 'on-track' ? 'bg-emerald-500/20' : 
          kpi.status === 'at-risk' ? 'bg-amber-500/20' : 
          'bg-rose-500/20'
        }`}>
          {kpi.status}
        </span>
      </div>
      <div className="flex items-end justify-between mt-2">
        <h3 className="text-3xl font-bold text-white">
          {kpi.value}{kpi.unit}
        </h3>
        <div className="flex items-center text-sm font-medium">
          <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
            {isPositive ? '▲' : '▼'} {Math.abs(kpi.change)}%
          </span>
        </div>
      </div>
      <div className="mt-2 text-[10px] opacity-60 font-medium">
        Target: {kpi.target}{kpi.unit}
      </div>

      {isEditing && (
        <KPIEditorModal 
          kpi={kpi} 
          onClose={() => setIsEditing(false)} 
          onSave={(updated) => {
            onUpdate?.(updated);
            setIsEditing(false);
          }}
        />
      )}
    </div>
  );
};

export default KPICard;
