
import React, { useState } from 'react';
import { KPI } from '../../types';
import { safeParseFloat } from '../../lib/utils';

interface Props {
  kpi: KPI;
  onSave: (updated: KPI) => void;
  onClose: () => void;
}

const KPIEditorModal: React.FC<Props> = ({ kpi, onSave, onClose }) => {
  const [val, setVal] = useState(kpi.value.toString());
  const [status, setStatus] = useState(kpi.status);

  const handleSave = () => {
    // If the input is a valid number (e.g., "123"), save as number.
    // If it's a string like "10k" or "$50", we keep it as a string for display,
    // but the system will use parsing utilities where math is needed.
    const numeric = parseFloat(val);
    const finalValue = isNaN(numeric) ? val : numeric;

    onSave({ 
      ...kpi, 
      value: finalValue, 
      status 
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Edit KPI: {kpi.label}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Value ({kpi.unit})</label>
            <input 
              type="text"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-600"
              placeholder="e.g. 95, 1.2k, $500"
            />
            <p className="text-[10px] text-slate-500 mt-1">Numeric values are recommended for best charting.</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Health Status</label>
            <div className="grid grid-cols-3 gap-2">
              {(['on-track', 'at-risk', 'critical'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${
                    status === s 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-800/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white">Cancel</button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default KPIEditorModal;
