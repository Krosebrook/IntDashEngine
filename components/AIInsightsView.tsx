
import React, { useState, useEffect } from 'react';
import { AIInsight, DepartmentConfig } from '../types';
import { getAIInsights } from '../services/geminiService';

interface Props {
  department: DepartmentConfig;
}

const AIInsightsView: React.FC<Props> = ({ department }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const data = await getAIInsights(department);
      setInsights(data);
      setLoading(false);
    };
    fetch();
  }, [department]);

  const priorityColors = {
    low: 'bg-blue-500/20 text-blue-400',
    medium: 'bg-amber-500/20 text-amber-400',
    high: 'bg-orange-500/20 text-orange-400',
    critical: 'bg-rose-500/20 text-rose-400'
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-slate-800 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight, idx) => (
        <div key={idx} className="p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-blue-500 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-slate-100">{insight.title}</h4>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${priorityColors[insight.priority]}`}>
              {insight.priority}
            </span>
          </div>
          <p className="text-sm text-slate-400 mb-2">{insight.description}</p>
          <div className="text-xs text-blue-400 font-medium">
            Expected Impact: {insight.impact}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AIInsightsView;
