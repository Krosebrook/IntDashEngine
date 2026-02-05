
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Brush
} from 'recharts';
import { ChartData } from '../../types';

interface Props {
  data: ChartData[];
  color?: string;
  showTarget?: boolean;
}

const SimpleAreaChart: React.FC<Props> = ({ data, color = "#3b82f6", showTarget = false }) => {
  const targetValue = data[0]?.target;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ bottom: 20 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
        <XAxis 
          dataKey="name" 
          stroke="#94a3b8" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          dy={10}
        />
        <YAxis 
          stroke="#94a3b8" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
          itemStyle={{ color: '#f8fafc' }}
        />
        {showTarget && targetValue && (
          <ReferenceLine y={targetValue} stroke="#10b981" strokeDasharray="3 3" label="Target" />
        )}
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorValue)" 
          animationDuration={1500}
        />
        <Brush dataKey="name" height={20} stroke="#475569" fill="#1e293b" tickFormatter={() => ''} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default SimpleAreaChart;
