
import React, { useState, useRef } from 'react';
import { DepartmentConfig } from '../types';
import { generateDashboardFromInput } from '../services/geminiService';

interface Props {
  onClose: () => void;
  onGenerate: (config: DepartmentConfig) => void;
}

const DashboardGeneratorModal: React.FC<Props> = ({ onClose, onGenerate }) => {
  const [mode, setMode] = useState<'upload' | 'text'>('upload');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setText(event.target.result as string);
        setMode('text'); // Switch to preview mode
      }
    };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError("Please provide some content.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const config = await generateDashboardFromInput(text);
      if (config) {
        // Ensure ID is unique-ish if model returns a generic one
        if (!config.id || config.id === 'dept-id') {
           config.id = `gen-${Math.random().toString(36).substr(2, 6)}`;
        }
        onGenerate(config);
        onClose();
      } else {
        setError("AI could not generate a valid configuration.");
      }
    } catch (err) {
      setError("Failed to generate dashboard. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </span>
              AI Dashboard Generator
            </h3>
            <p className="text-sm text-slate-400 mt-1">Upload a report, CSV, or paste text to generate a live dashboard.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => setMode('upload')}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${mode === 'upload' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-800 bg-slate-900 text-slate-500 hover:border-slate-700'}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              <span className="font-bold text-sm">Upload File</span>
            </button>
            <button 
              onClick={() => setMode('text')}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${mode === 'text' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-800 bg-slate-900 text-slate-500 hover:border-slate-700'}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="font-bold text-sm">Paste Text</span>
            </button>
          </div>

          {mode === 'upload' ? (
            <div 
              className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center hover:border-blue-500 hover:bg-slate-800/50 transition-all cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".csv,.json,.txt,.md"
              />
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-slate-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </div>
              <h4 className="text-white font-bold mb-1">Click to upload document</h4>
              <p className="text-sm text-slate-500">Supports CSV, JSON, TXT, MD</p>
            </div>
          ) : (
            <textarea
              className="w-full h-64 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm text-white font-mono placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Paste your report content, meeting notes, or raw data here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          )}
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
          <button 
            onClick={handleGenerate}
            disabled={isLoading || !text}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Analyzing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                Generate Dashboard
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardGeneratorModal;
