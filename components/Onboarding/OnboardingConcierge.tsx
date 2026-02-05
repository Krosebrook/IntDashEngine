
import React, { useState } from 'react';
import { classifyGovernance, GovernanceProfile, validatePromptSafety } from '../../lib/governance';

interface Props {
  onComplete: (profile: GovernanceProfile) => void;
  onClose: () => void;
}

const OnboardingConcierge: React.FC<Props> = ({ onComplete, onClose }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ role: '', task: '', env: 'Experimentation' });
  const [profile, setProfile] = useState<GovernanceProfile | null>(null);

  const handleNext = () => {
    if (step === 1) {
      const result = classifyGovernance(form.role, form.task, form.env);
      setProfile(result);
      setStep(2);
    } else {
      if (profile) onComplete(profile);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/20">AI</div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Onboarding Concierge</h2>
              <p className="text-sm text-slate-500">Governance & Safety Setup</p>
            </div>
          </div>

          {step === 1 ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Your Role</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.role}
                  onChange={e => setForm({...form, role: e.target.value})}
                >
                  <option value="">Select Role...</option>
                  <option value="Engineer">Software Engineer</option>
                  <option value="Product">Product Manager</option>
                  <option value="Ops">Operations</option>
                  <option value="Exec">Executive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Intended Task</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.task}
                  onChange={e => setForm({...form, task: e.target.value})}
                >
                  <option value="">Select Task...</option>
                  <option value="CodeGen">Code Generation</option>
                  <option value="Analysis">Data Analysis</option>
                  <option value="Strategy">Strategy & Writing</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Target Environment</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Experimentation', 'Staging', 'Production'].map(e => (
                    <button 
                      key={e}
                      onClick={() => setForm({...form, env: e})}
                      className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${form.env === e ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className={`p-4 rounded-2xl border-2 flex items-center gap-4 ${profile?.risk === 'high' ? 'border-rose-500/30 bg-rose-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${profile?.risk === 'high' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                  {profile?.risk.toUpperCase()[0]}
                </div>
                <div>
                  <h4 className="font-bold text-white capitalize">{profile?.risk} Risk Detected</h4>
                  <p className="text-xs text-slate-400">Compliance Domain: {profile?.domain}</p>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                <h5 className="text-xs font-bold text-slate-300 uppercase mb-3">Model Binding Profile</h5>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Target Model:</span>
                    <span className="text-blue-400 font-mono">{profile?.recommendedModel}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Safety Gates:</span>
                    <span className="text-emerald-400">ACTIVE</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile?.complianceFlags.map(f => (
                      <span key={f} className="px-2 py-0.5 bg-slate-700 text-[9px] font-bold rounded text-slate-300">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-white transition-colors"
            >
              Skip for now
            </button>
            <button 
              disabled={step === 1 && (!form.role || !form.task)}
              onClick={handleNext}
              className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all transform active:scale-95"
            >
              {step === 1 ? 'Analyze Intent' : 'Activate Governance'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingConcierge;
