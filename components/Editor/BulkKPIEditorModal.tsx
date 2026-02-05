
import React, { useState } from 'react';

interface Props {
  count: number;
  onSave: (changes: { status?: 'on-track' | 'at-risk' | 'critical', targetMultiplier?: number }) => void;
  onClose: () => void;
}

const BulkKPIEditorModal: React.FC<Props> = ({ count, onSave, onClose }) => {
  const [status, setStatus] = useState<'on-track' | 'at-risk' | 'critical' | null>(null);
  const [targetAction, setTargetAction] = useState<'none' | 'increase' | 'decrease'>('none');
  const [targetPercent, setTargetPercent] = useState(10);

  const handleSave = () => {
    const changes: any = {};
    if (status) changes.status = status;
    if (targetAction !== 'none') {
      const multiplier = targetAction === 'increase' ? (1 + targetPercent / 100) : (1 - targetPercent / 100);
      changes.targetMultiplier = multiplier;
    }
    onSave(changes);
  };

  const hasChanges = status !== null || targetAction !== 'none';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Bulk Edit Mode
            </h3>
            <p className="text-xs text-slate-400 pl-4">{count} KPIs selected</p>
          </div>
          <div className="flex gap-3">
             <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700">
                Cancel
             </button>
             <button 
                onClick={handleSave}
                disabled={!hasChanges}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                Apply Changes
             </button>
          </div>
        </div>
        <div className="p-8 space-y-8">
          
          {/* Status Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">Set Status</label>
                {status && <button onClick={() => setStatus(null)} className="text-[10px] text-slate-500 hover:text-slate-300">Clear</button>}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['on-track', 'at-risk', 'critical'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(status === s ? null : s)} // Toggle
                  className={`py-3 px-4 text-xs font-bold uppercase rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                    status === s 
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                      : 'bg-slate-800 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-800/80'
                  }`}
                >
                  {status === s && (
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                  )}
                  {s}
                </button>
              ))}
            </div>
            {!status && <p className="text-[11px] text-slate-500 pl-1">No status selected. Original status will be preserved.</p>}
          </div>

          <div className="border-t border-slate-800/50"></div>

          {/* Target Section */}
          <div className="space-y-3">
             <div className="flex justify-between items-baseline">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">Adjust Targets</label>
             </div>
             
             <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                 <div className="flex gap-2 mb-4">
                     <button onClick={() => setTargetAction('none')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${targetAction === 'none' ? 'bg-slate-700 border-slate-600 text-white shadow-sm' : 'border-slate-800 text-slate-500 hover:bg-slate-800'}`}>No Change</button>
                     <button onClick={() => setTargetAction('increase')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${targetAction === 'increase' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-sm' : 'border-slate-800 text-slate-500 hover:bg-slate-800'}`}>Increase</button>
                     <button onClick={() => setTargetAction('decrease')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${targetAction === 'decrease' ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-sm' : 'border-slate-800 text-slate-500 hover:bg-slate-800'}`}>Decrease</button>
                 </div>
                 
                 {targetAction !== 'none' && (
                   <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                     <div className="flex-1">
                        <div className="text-xs text-slate-400 mb-1.5">Percentage Adjustment</div>
                        <input 
                            type="range" 
                            min="1" 
                            max="100" 
                            value={targetPercent} 
                            onChange={(e) => setTargetPercent(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                     </div>
                     <div className="flex items-center gap-2 bg-slate-900 rounded-lg border border-slate-700 px-3 py-2 min-w-[100px] justify-center">
                       <input 
                         type="number" 
                         value={targetPercent} 
                         onChange={(e) => setTargetPercent(Number(e.target.value))}
                         className="w-12 bg-transparent text-white font-bold text-right outline-none"
                       />
                       <span className="text-sm text-slate-500 font-bold">%</span>
                     </div>
                   </div>
                 )}
                 {targetAction !== 'none' && (
                    <p className="text-[10px] text-slate-500 mt-3 flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Targets will be multiplied by {targetAction === 'increase' ? (1 + targetPercent / 100).toFixed(2) : (1 - targetPercent / 100).toFixed(2)}x
                    </p>
                 )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkKPIEditorModal;
