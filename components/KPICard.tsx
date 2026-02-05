
import React, { useState, useRef, useMemo } from 'react';
import { KPI, User } from '../types';
import { Permissions } from '../lib/permissions';
import { safeParseFloat, generateStableHistoryData } from '../lib/utils';
import KPIEditorModal from './Editor/KPIEditorModal';
import { toPng, toSvg } from 'html-to-image';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import SimpleLineChart from './charts/SimpleLineChart';

interface Props {
  kpi: KPI;
  currentUser: User | null;
  onUpdate?: (updated: KPI) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const KPICard: React.FC<Props> = ({ 
  kpi, 
  currentUser, 
  onUpdate, 
  isSelectMode = false, 
  isSelected = false, 
  onToggleSelect 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isPositive = kpi.trend === 'up';
  const canEdit = Permissions.canEditKPI(currentUser);

  const statusColors = {
    'on-track': 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400',
    'at-risk': 'bg-amber-500/10 border-amber-500/50 text-amber-400',
    'critical': 'bg-rose-500/10 border-rose-500/50 text-rose-400'
  };

  const progressColors = {
    'on-track': 'from-emerald-500 to-emerald-700',
    'at-risk': 'from-amber-500 to-amber-700',
    'critical': 'from-rose-500 to-rose-700'
  };

  // Generate deterministic data for visualization so it doesn't jitter on re-renders
  const historyData = useMemo(() => {
    return generateStableHistoryData(kpi.id, kpi.value, kpi.target);
  }, [kpi.id, kpi.value, kpi.target]);

  const sparklineData = useMemo(() => historyData.slice(-7), [historyData]);

  // Calculate progress percentage safely
  const progressPercent = useMemo(() => {
    const val = safeParseFloat(kpi.value);
    if (kpi.target === 0) return 0;
    return Math.min(Math.max((val / kpi.target) * 100, 0), 100);
  }, [kpi.value, kpi.target]);

  const escapeCSV = (str: string) => {
    if (!str) return '""';
    return `"${str.replace(/"/g, '""')}"`;
  };

  const handleExportCSV = (e: React.MouseEvent) => {
    e.stopPropagation();
    const headers = "ID,Label,Description,Value,Unit,Target,Status,Trend,Change\n";
    const row = `${kpi.id},${escapeCSV(kpi.label)},${escapeCSV(kpi.description || '')},${kpi.value},${kpi.unit},${kpi.target},${kpi.status},${kpi.trend},${kpi.change}\n`;
    const csvContent = "data:text/csv;charset=utf-8," + headers + row;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${kpi.id}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportImage = async (e: React.MouseEvent, type: 'png' | 'svg') => {
    e.stopPropagation();
    if (!cardRef.current) return;

    const filter = (node: HTMLElement) => {
      return !node.classList?.contains('export-controls') && 
             !node.classList?.contains('edit-btn') &&
             !node.classList?.contains('history-btn') &&
             !node.classList?.contains('selection-overlay');
    };

    try {
      const dataUrl = type === 'png' 
        ? await toPng(cardRef.current, { filter, backgroundColor: '#0f172a' }) 
        : await toSvg(cardRef.current, { filter, backgroundColor: '#0f172a' });
      
      const link = document.createElement('a');
      link.download = `${kpi.id}.${type}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
    }
  };

  return (
    <>
      <div 
        ref={cardRef}
        className={`group relative p-5 rounded-xl border transition-all duration-300 h-40 flex flex-col justify-between 
          ${isSelectMode 
            ? isSelected 
              ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500 shadow-lg shadow-blue-500/20 scale-[1.02]' 
              : `bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-500 opacity-90 hover:opacity-100 cursor-pointer`
            : `${statusColors[kpi.status]} bg-slate-800/50 hover:scale-[1.02]`
          } 
          ${isSelectMode ? 'cursor-pointer' : ''}`}
        onClick={() => isSelectMode && onToggleSelect?.()}
        role={isSelectMode ? "checkbox" : "article"}
        aria-checked={isSelectMode ? isSelected : undefined}
      >
        {isSelectMode ? (
          <div className="selection-overlay absolute inset-0 z-10 flex items-start justify-end p-3 pointer-events-none">
            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isSelected ? 'bg-blue-500 border-blue-500 shadow-lg scale-110' : 'border-slate-500 bg-slate-900/80 group-hover:border-slate-300'}`}>
              {isSelected && <svg className="w-4 h-4 text-white font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            {isSelected && (
              <div className="absolute inset-0 bg-blue-500/5 rounded-xl pointer-events-none animate-in fade-in duration-200" />
            )}
          </div>
        ) : (
          <>
            <div className="absolute top-2 right-2 flex gap-1 z-20">
               {/* History Button */}
               <button
                  onClick={(e) => { e.stopPropagation(); setShowHistory(true); }}
                  className="history-btn p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 hover:border-slate-600 transition-all backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100"
                  title="View History"
               >
                 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                 </svg>
               </button>

              {canEdit && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                  className="edit-btn p-1.5 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg border border-slate-700 hover:border-blue-500 transition-all backdrop-blur-sm shadow-sm"
                  title="Edit KPI"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Export Controls */}
            <div className="export-controls absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 z-20 bg-slate-900/90 rounded-lg p-0.5 border border-slate-700 shadow-xl transition-all">
              <button onClick={handleExportCSV} className="p-1 hover:bg-slate-800 rounded text-[9px] font-bold text-slate-400 hover:text-white uppercase px-1.5">CSV</button>
              <div className="w-[1px] bg-slate-700 my-0.5"></div>
              <button onClick={(e) => handleExportImage(e, 'png')} className="p-1 hover:bg-slate-800 rounded text-[9px] font-bold text-slate-400 hover:text-white uppercase px-1.5">PNG</button>
              <button onClick={(e) => handleExportImage(e, 'svg')} className="p-1 hover:bg-slate-800 rounded text-[9px] font-bold text-slate-400 hover:text-white uppercase px-1.5">SVG</button>
            </div>
          </>
        )}

        <div className="flex justify-between items-start relative pr-16">
          <div 
            className="relative group/tooltip"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <span className="text-xs font-semibold uppercase tracking-wider opacity-70 cursor-help border-b border-dashed border-slate-600 hover:border-slate-400 transition-colors">
              {kpi.label}
            </span>
            
            {/* Rich Tooltip with Sparkline */}
            {showTooltip && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-none">
                 <div className="text-white text-xs font-bold mb-2 border-b border-slate-800 pb-2 flex justify-between">
                   <span>{kpi.label}</span>
                   <span className="text-[10px] text-slate-500 font-normal">ID: {kpi.id}</span>
                 </div>
                 <div className="text-slate-400 text-[11px] leading-relaxed mb-3">
                   {kpi.description || 'No description available for this metric.'}
                 </div>
                 <div className="h-16 w-full bg-slate-950/50 rounded-lg border border-slate-800/50 p-1">
                   <div className="text-[9px] text-slate-500 mb-1 px-1">7 Day Trend</div>
                   <ResponsiveContainer width="100%" height="70%">
                     <LineChart data={sparklineData}>
                       <Line 
                         type="monotone" 
                         dataKey="value" 
                         stroke={isPositive ? '#34d399' : '#f43f5e'} 
                         strokeWidth={2} 
                         dot={false} 
                       />
                       <YAxis domain={['dataMin', 'dataMax']} hide />
                     </LineChart>
                   </ResponsiveContainer>
                 </div>
              </div>
            )}
          </div>

          {!isSelectMode && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              kpi.status === 'on-track' ? 'bg-emerald-500/20' : 
              kpi.status === 'at-risk' ? 'bg-amber-500/20' : 
              'bg-rose-500/20'
            }`}>
              {kpi.status}
            </span>
          )}
        </div>
        
        <div className="mt-2">
          <div className="flex items-end justify-between">
            <h3 className={`text-3xl font-bold transition-colors ${isSelectMode && isSelected ? 'text-blue-200' : 'text-white'}`}>
              {kpi.value}<span className="text-lg text-slate-400 ml-0.5">{kpi.unit}</span>
            </h3>
            <div className="flex items-center text-sm font-medium">
              <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                {isPositive ? '▲' : '▼'} {Math.abs(kpi.change)}%
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-700 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full bg-gradient-to-r ${progressColors[kpi.status]} transition-all duration-1000`} 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        <div className="mt-2 text-[10px] opacity-60 font-medium flex justify-between items-center">
          <span>Target: {kpi.target}{kpi.unit}</span>
          {isSelectMode && isSelected && <span className="text-blue-400 italic font-bold">Selected</span>}
        </div>
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

      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
             <button onClick={() => setShowHistory(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
             <h3 className="text-xl font-bold text-white mb-1">{kpi.label} History</h3>
             <p className="text-sm text-slate-400 mb-6">Historical performance over the last 30 days</p>
             <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                <SimpleLineChart data={historyData} showTarget showTrend color={isPositive ? '#34d399' : '#f43f5e'} />
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KPICard;
