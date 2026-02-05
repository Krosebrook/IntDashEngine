
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

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Bulk Edit ({count} KPIs)</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        <div className="p-6 space-y-6">
          
          {/* Status Section */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Set Status For All</label>
            <div className="grid grid-cols-3 gap-2">
              {(['on-track', 'at-risk', 'critical'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(status === s ? null : s)} // Toggle
                  className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${
                    status === s 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {!status && <p className="text-[10px] text-slate-500 mt-2 italic">* Leave unselected to keep original status</p>}
          </div>

          <div className="border-t border-slate-800 pt-4">
             <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Adjust Targets</label>
             <div className="flex gap-2 mb-3">
                 <button onClick={() => setTargetAction('none')} className={`flex-1 py-1.5 text-xs rounded border ${targetAction === 'none' ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-800 text-slate-500'}`}>No Change</button>
                 <button onClick={() => setTargetAction('increase')} className={`flex-1 py-1.5 text-xs rounded border ${targetAction === 'increase' ? 'bg-emerald-900/50 border-emerald-800 text-emerald-400' : 'border-slate-800 text-slate-500'}`}>Increase</button>
                 <button onClick={() => setTargetAction('decrease')} className={`flex-1 py-1.5 text-xs rounded border ${targetAction === 'decrease' ? 'bg-rose-900/50 border-rose-800 text-rose-400' : 'border-slate-800 text-slate-500'}`}>Decrease</button>
             </div>
             {targetAction !== 'none' && (
               <div className="flex items-center gap-2">
                 <span className="text-sm text-slate-400">By</span>
                 <input 
                   type="number" 
                   value={targetPercent} 
                   onChange={(e) => setTargetPercent(Number(e.target.value))}
                   className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-center"
                 />
                 <span className="text-sm text-slate-400">%</span>
               </div>
             )}
          </div>
        </div>
        <div className="p-6 bg-slate-800/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white">Cancel</button>
          <button 
            onClick={handleSave}
            disabled={!status && targetAction === 'none'}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkKPIEditorModal;
