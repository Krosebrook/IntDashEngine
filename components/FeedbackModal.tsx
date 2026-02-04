
import React, { useState } from 'react';
import { User, FeedbackSubmission } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const FeedbackModal: React.FC<Props> = ({ isOpen, onClose, user }) => {
  const [type, setType] = useState<'bug' | 'feature' | 'comment'>('comment');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submission: FeedbackSubmission = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      type,
      title,
      description,
      timestamp: Date.now()
    };
    
    // Persist to local storage
    const existing = JSON.parse(localStorage.getItem('int_feedback') || '[]');
    localStorage.setItem('int_feedback', JSON.stringify([...existing, submission]));
    
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setTitle('');
      setDescription('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {submitted ? (
          <div className="p-12 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl animate-bounce">
              ✓
            </div>
            <h3 className="text-xl font-bold text-white">Thank you!</h3>
            <p className="text-slate-400 text-sm">Your feedback helps us build the future of INT Inc.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-lg font-bold text-white">Share your feedback</h3>
              <button type="button" onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex gap-2">
                {(['comment', 'bug', 'feature'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                      type === t 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 ml-1">Summary</label>
                  <input
                    required
                    type="text"
                    placeholder="Briefly describe your request..."
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 ml-1">Details</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="The more information, the better!"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600 resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all transform active:scale-95"
              >
                Submit Feedback
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
