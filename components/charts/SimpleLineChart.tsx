
import React, { useRef, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Brush
} from 'recharts';
import { ChartData } from '../../types';

interface Props {
  data: ChartData[];
  color?: string;
  showTrend?: boolean;
  showTarget?: boolean;
}

// Simple Linear Regression
const calculateTrend = (data: ChartData[], yKey: string) => {
  if (data.length < 2) return [];
  
  const n = data.length;
  const x = data.map((_, i) => i);
  const y = data.map(d => Number(d[yKey]));
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumXX = x.reduce((a, b) => a + b * b, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return data.map((d, i) => ({
    ...d,
    trend: Number((slope * i + intercept).toFixed(1))
  }));
};

const SimpleLineChart: React.FC<Props> = ({ 
  data, 
  color = "#3b82f6", 
  showTrend = false, 
  showTarget = false 
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const targetValue = data[0]?.target;

  const chartData = useMemo(() => {
    return showTrend ? calculateTrend(data, 'value') : data;
  }, [data, showTrend]);

  const handleExport = async (format: 'png' | 'svg') => {
    const svgElement = chartRef.current?.querySelector('.recharts-surface');
    if (!svgElement) return;

    setIsExporting(true);
    
    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      if (format === 'svg') {
        const link = document.createElement('a');
        link.href = url;
        link.download = `chart-export-${Date.now()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Convert to PNG via Canvas
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const bbox = svgElement.getBoundingClientRect();
          // Scale for better resolution
          const scale = 2;
          canvas.width = bbox.width * scale;
          canvas.height = bbox.height * scale;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(scale, scale);
            ctx.fillStyle = '#0f172a'; // Match background
            ctx.fillRect(0, 0, bbox.width, bbox.height);
            ctx.drawImage(img, 0, 0, bbox.width, bbox.height);
            
            try {
              const pngUrl = canvas.toDataURL('image/png');
              const link = document.createElement('a');
              link.href = pngUrl;
              link.download = `chart-export-${Date.now()}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (e) {
              console.error("Canvas export failed", e);
              alert("Failed to create PNG image. Security settings may prevent canvas export.");
            }
          }
        };
        img.onerror = () => {
             alert("Failed to process chart image.");
        };
        img.src = url;
      }
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setIsExporting(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl z-50">
          <p className="text-slate-300 text-xs font-bold mb-2">{label}</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-xs mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
              <span className="text-slate-400 capitalize">{p.name}:</span>
              <span className="text-white font-bold">{p.value}</span>
            </div>
          ))}
          {showTarget && targetValue !== undefined && (
            <div className="flex items-center gap-2 text-xs border-t border-slate-800 pt-2 mt-2">
              <span className="text-slate-500">Target:</span>
              <span className="text-emerald-400 font-bold">{targetValue}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full relative group">
      <div className="absolute top-[-30px] right-0 flex gap-2 z-10">
         <div className="flex gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button 
              onClick={() => handleExport('svg')} 
              disabled={isExporting}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 focus:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label="Export chart as SVG"
            >
              SVG
            </button>
            <button 
              onClick={() => handleExport('png')} 
              disabled={isExporting}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 focus:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label="Export chart as PNG"
            >
              {isExporting ? '...' : 'PNG'}
            </button>
         </div>
      </div>
      
      <div ref={chartRef} className="h-[350px] w-full" role="img" aria-label="Line chart showing performance trends over time">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ bottom: 20, top: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1 }} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} verticalAlign="top" height={36}/>
            
            {showTarget && targetValue && (
              <ReferenceLine y={targetValue} stroke="#10b981" strokeDasharray="4 4" label={{ position: 'right', value: 'Target', fill: '#10b981', fontSize: 10 }} />
            )}
            
            {showTrend && (
              <Line type="monotone" dataKey="trend" name="Trend" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} />
            )}
            
            <Line
              type="monotone"
              dataKey="value"
              name="Performance"
              stroke={color}
              strokeWidth={3}
              dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#0f172a' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1500}
            />
            <Brush dataKey="name" height={20} stroke="#475569" fill="#1e293b" tickFormatter={() => ''} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SimpleLineChart;
