import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DepartmentConfig, KPI } from '../types';

interface Props {
  departments: DepartmentConfig[];
  localKPIs: Record<string, KPI[]>;
}

const DepartmentComparison: React.FC<Props> = ({ departments, localKPIs }) => {
  const data = departments.map(dept => {
    const kpis = localKPIs[dept.id] || dept.kpis;
    if (!kpis.length) return { name: dept.name, score: 0, deptId: dept.id };

    // Calculate Score: On-Track = 1, At-Risk = 0.5, Critical = 0
    const totalScore = kpis.reduce((acc, kpi) => {
      if (kpi.status === 'on-track') return acc + 100;
      if (kpi.status === 'at-risk') return acc + 50;
      return acc;
    }, 0);
    
    const avgScore = Math.round(totalScore / kpis.length);

    // Shorten names for axis
    const shortName = dept.name.length > 15 ? dept.name.substring(0, 12) + '...' : dept.name;

    return {
      name: shortName,
      fullName: dept.name,
      score: avgScore,
      deptId: dept.id
    };
  }).sort((a, b) => b.score - a.score).slice(0, 8); // Top 8 for UI cleanliness

  const getBarColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Emerald
    if (score >= 50) return '#f59e0b'; // Amber
    return '#f43f5e'; // Rose
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-white text-xs font-bold mb-1">{payload[0].payload.fullName}</p>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">Health Score:</span>
            <span className="font-bold" style={{ color: payload[0].fill }}>{payload[0].value}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={120} 
            tick={{ fill: '#94a3b8', fontSize: 11 }} 
            tickLine={false} 
            axisLine={false} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={18} background={{ fill: '#1e293b' }}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DepartmentComparison;