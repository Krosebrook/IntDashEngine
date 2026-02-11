
import React, { useState, useRef, useMemo } from 'react';
import { KPI, User, KPIRecommendation } from '../types';
import { Permissions } from '../lib/permissions';
import { safeParseFloat, generateStableHistoryData } from '../lib/utils';
import KPIEditorModal from './Editor/KPIEditorModal';
import { toPng, toSvg } from 'html-to-image';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import SimpleLineChart from './charts/SimpleLineChart';
import { getKPIRecommendations } from '../services/geminiService';

interface Props {
  kpi: KPI;
  currentUser: User | null;
  departmentName?: string;
  departmentDescription?: string;
  onUpdate?: (updated: KPI) => void;
  onAddKPI?: (newKPI: KPI) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const KPICard: React.FC<Props> = ({ 
  kpi, 
  currentUser, 
  departmentName = "Department",
  departmentDescription,
  onUpdate,
  onAddKPI,
  isSelectMode = false, 
  isSelected = false, 
  onToggleSelect 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<KPIRecommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  
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

  const historyData = useMemo(() => {
    return generateStableHistoryData(kpi.id, kpi.value, kpi.target);
  }, [kpi.id, kpi.value, kpi.target]);

  const sparklineData = useMemo(() => historyData.slice(-7), [historyData]);

  const progressPercent = useMemo(() => {
    const val = safeParseFloat(kpi.value);
    if (kpi.target === 0) return 0;
    return Math.min(Math.max((val / kpi.target) * 100, 0), 100);
  }, [kpi.value, kpi.target]);

  const handleRecsToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showRecommendations && recommendations.length === 0) {
      setLoadingRecs(true);
      setShowRecommendations(true);
      try {
        const data = await getKPIRecommendations(kpi, departmentName, departmentDescription);
        setRecommendations(data);
      } catch (err) {
        console.error("Discovery failed", err);
      } finally {
        setLoadingRecs(false);
      }
    } else {
      setShowRecommendations(!showRecommendations);
    }
  };

  const handleAddRecommended = (rec: KPIRecommendation) => {
    if (!onAddKPI) return;
    
    const newKPI: KPI = {
      id: `rec-${Math.random().toString(36).substr(2, 6)}`,
      label: rec.label,
      description: `${rec.description} | Reason: ${rec.reasoning}`,
      value: 0,
      unit: rec.unit,
      target: rec.suggestedTarget,
      trend: 'flat',
      change: 0,
      status: 'on-track'
    };
    
    onAddKPI(newKPI);
    setRecommendations(prev => prev.filter(r => r.label !== rec.label));
    if (recommendations.length <= 1) setShowRecommendations(false);
  };

  return (
    <>
      <div 
        ref={cardRef}
        className={`group relative rounded-xl border transition-all duration-300 flex flex-col focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden
          ${isSelectMode 
            ? isSelected 
              ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500 shadow-lg' 
              : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'
            : `${statusColors[kpi.status]} bg-slate-800/50 hover:shadow-xl hover:shadow-slate-950/50`
          } 
          ${isSelectMode ? 'cursor-pointer' : ''}`}
        onClick={() => isSelectMode && onToggleSelect?.()}
        role={isSelectMode ? "checkbox" : "article"}
      >
        {/* Main Content Area */}
        <div className="p-5 flex flex-col justify-between h-40">
          <div className="absolute top-2 right-2 flex gap-1 z-20">
            {/* Discovery Lightbulb Trigger */}
            {!isSelectMode && (
              <button
                onClick={handleRecsToggle}
                className={`action-btn p-1.5 rounded-lg border transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100 ${
                  showRecommendations ? 'bg-amber-500 text-slate-900 border-amber-400 scale-110 shadow-lg shadow-amber-500/20' : 'bg-slate-800 text-amber-500 border-slate-700 hover:border-amber-500/50'
                } ${loadingRecs ? 'animate-pulse' : ''}`}
                title="AI Metric Discovery"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 11-2 0 1 1 0 012 0zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z" />
                </svg>
              </button>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); setShowHistory(true); }}
              className="action-btn p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100"
              title="View History"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {canEdit && !isSelectMode && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className="action-btn p-1.5 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100"
                title="Edit KPI"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex justify-between items-start relative pr-16">
            <div 
              className="relative cursor-help"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70 border-b border-dashed border-slate-600">
                {kpi.label}
              </span>
              {showTooltip && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl z-50 pointer-events-none">
                   <div className="text-white text-xs font-bold mb-2 border-b border-slate-800 pb-2 flex justify-between">
                     <span>{kpi.label}</span>
                     <span className="text-[10px] text-slate-500 font-normal">ID: {kpi.id}</span>
                   </div>
                   <div className="text-slate-400 text-[11px] leading-relaxed mb-3">{kpi.description}</div>
                   <div className="h-16 w-full bg-slate-950/50 rounded-lg border border-slate-800/50 p-1">
                     <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={sparklineData}>
                         <Line type="monotone" dataKey="value" stroke={isPositive ? '#34d399' : '#f43f5e'} strokeWidth={2} dot={false} />
                         <YAxis domain={['dataMin', 'dataMax']} hide />
                       </LineChart>
                     </ResponsiveContainer>
                   </div>
                </div>
              )}
            </div>
            {!isSelectMode && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                kpi.status === 'on-track' ? 'bg-emerald-500/20' : kpi.status === 'at-risk' ? 'bg-amber-500/20' : 'bg-rose-500/20'
              }`}>
                {kpi.status}
              </span>
            )}
          </div>
          
          <div className="mt-2">
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-white">
                {kpi.value}<span className="text-lg text-slate-400 ml-0.5">{kpi.unit}</span>
              </h3>
              <span className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? '▲' : '▼'} {Math.abs(kpi.change)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full mt-3 overflow-hidden">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${progressColors[kpi.status]} transition-all duration-1000`} 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-2 text-[10px] opacity-60 font-medium flex justify-between items-center">
            <span>Target: {kpi.target}{kpi.unit}</span>
          </div>
        </div>

        {/* AI Discovery Integrated Section */}
        {showRecommendations && (
          <div className="bg-amber-500/5 border-t border-amber-500/20 p-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                </svg>
                AI discovery
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowRecommendations(false); }}
                className="text-amber-500/50 hover:text-amber-500 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
            {loadingRecs ? (
              <div className="space-y-3 py-2">
                <div className="h-10 bg-amber-500/10 rounded-lg animate-pulse" />
                <div className="h-10 bg-amber-500/10 rounded-lg animate-pulse" />
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((rec, i) => (
                  <div key={i} className="group/item bg-slate-900/40 p-3 rounded-lg border border-amber-500/10 hover:border-amber-500/30 transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <h5 className="text-[11px] font-bold text-white">{rec.label}</h5>
                      <span className="text-[9px] text-amber-400/80 font-mono">Goal: {rec.suggestedTarget}{rec.unit}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight mb-2 line-clamp-2">{rec.reasoning}</p>
                    {onAddKPI && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAddRecommended(rec); }}
                        className="w-full text-[9px] bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-slate-950 py-1.5 rounded transition-all font-bold uppercase tracking-widest border border-amber-500/20"
                      >
                        Adopt metric
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-[10px] text-slate-500 font-medium italic">No further suggestions for this metric.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <KPIEditorModal kpi={kpi} onClose={() => setIsEditing(false)} onSave={(u) => { onUpdate?.(u); setIsEditing(false); }} />
      )}

      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative">
             <button onClick={() => setShowHistory(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
             <h3 className="text-xl font-bold text-white mb-6">{kpi.label} History</h3>
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
