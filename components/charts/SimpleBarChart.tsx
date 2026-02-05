
import React from 'react';
import {
  BarChart,
  Bar,
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

const SimpleBarChart: React.FC<Props> = ({ data, color = "#3b82f6", showTarget = false }) => {
  const targetValue = data[0]?.target;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
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
          cursor={{ fill: '#1e293b' }}
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
          itemStyle={{ color: '#f8fafc' }}
        />
        {showTarget && targetValue && (
          <ReferenceLine y={targetValue} stroke="#10b981" strokeDasharray="3 3" />
        )}
        <Bar 
          dataKey="value" 
          fill={color} 
          radius={[4, 4, 0, 0]}
          barSize={40}
          animationDuration={1500}
        />
        <Brush dataKey="name" height={20} stroke="#475569" fill="#1e293b" tickFormatter={() => ''} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SimpleBarChart;
