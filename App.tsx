
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DEPARTMENTS as INITIAL_DEPARTMENTS, MOCK_CHART_DATA } from './lib/mockData';
import { DepartmentConfig, User, KPI } from './types';
import { Permissions } from './lib/permissions';
import { safeParseFloat } from './lib/utils';
import DepartmentSwitcher from './components/DepartmentSwitcher';
import KPICard from './components/KPICard';
import AIInsightsView from './components/AIInsightsView';
import SimpleLineChart from './components/charts/SimpleLineChart';
import SimpleBarChart from './components/charts/SimpleBarChart';
import SimpleAreaChart from './components/charts/SimpleAreaChart';
import DepartmentComparison from './components/DepartmentComparison';
import BulkKPIEditorModal from './components/Editor/BulkKPIEditorModal';
import DashboardGeneratorModal from './components/DashboardGeneratorModal';
import OnboardingConcierge from './components/Onboarding/OnboardingConcierge';
import AuthView from './components/AuthView';
import FeedbackModal from './components/FeedbackModal';
import UserManagement from './components/Admin/UserManagement';

type ViewMode = 'dashboard' | 'management' | 'settings';
type ChartType = 'line' | 'bar' | 'area';
type FilterStatus = 'all' | 'on-track' | 'at-risk' | 'critical';
type SortOption = 'name' | 'value' | 'change';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<DepartmentConfig[]>(INITIAL_DEPARTMENTS);
  const [currentDept, setCurrentDept] = useState<DepartmentConfig>(INITIAL_DEPARTMENTS[INITIAL_DEPARTMENTS.length - 1]);
  const [localKPIs, setLocalKPIs] = useState<Record<string, KPI[]>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [showTrend, setShowTrend] = useState(false);
  const [showTarget, setShowTarget] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [selectedKPIIds, setSelectedKPIIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const liveIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('int_user_session');
    if (savedSession) {
      setCurrentUser(JSON.parse(savedSession));
      // Show onboarding if never seen
      if (!localStorage.getItem('int_onboarding_done')) {
        setIsOnboardingOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isLiveMode) {
      const simulateLiveUpdates = () => {
        setLocalKPIs(prev => {
          const deptId = currentDept.id;
          const currentKPIs = prev[deptId] || currentDept.kpis;
          const indicesToUpdate = Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () => 
            Math.floor(Math.random() * currentKPIs.length)
          );
          const updatedList = currentKPIs.map((kpi, idx) => {
            if (indicesToUpdate.includes(idx) && typeof kpi.value === 'number') {
               const drift = (Math.random() * 0.04 - 0.02); 
               const newValue = Number((kpi.value * (1 + drift)).toFixed(2));
               return { ...kpi, value: newValue, change: Number((kpi.change + drift * 100).toFixed(1)) };
            }
            return kpi;
          });
          return { ...prev, [deptId]: updatedList };
        });
      };
      liveIntervalRef.current = window.setInterval(simulateLiveUpdates, 2000);
    } else {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
    }
    return () => { if (liveIntervalRef.current) clearInterval(liveIntervalRef.current); };
  }, [isLiveMode, currentDept.id, currentDept.kpis]);

  const handleLogout = () => {
    localStorage.removeItem('int_user_session');
    setCurrentUser(null);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const updateKPI = (deptId: string, updatedKPI: KPI) => {
    setLocalKPIs(prev => {
      const deptKPIs = prev[deptId] || departments.find(d => d.id === deptId)?.kpis || [];
      return { ...prev, [deptId]: deptKPIs.map(k => k.id === updatedKPI.id ? updatedKPI : k) };
    });
  };

  const toggleSelectKPI = (id: string) => {
    const newSet = new Set(selectedKPIIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedKPIIds(newSet);
  };

  const handleBulkExportCSV = () => {
    const currentKPIs = localKPIs[currentDept.id] || currentDept.kpis;
    const selected = currentKPIs.filter(k => selectedKPIIds.has(k.id));
    if (selected.length === 0) return;
    const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
    const headers = "ID,Label,Description,Value,Unit,Target,Status,Trend,Change\n";
    const rows = selected.map(kpi => `${kpi.id},${escape(kpi.label)},${escape(kpi.description || '')},${kpi.value},${kpi.unit},${kpi.target},${kpi.status},${kpi.trend},${kpi.change}`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bulk_export_${currentDept.id}.csv`);
    link.click();
  };

  const handleBulkSave = (changes: { status?: 'on-track' | 'at-risk' | 'critical', targetMultiplier?: number }) => {
    const currentKPIs = localKPIs[currentDept.id] || currentDept.kpis;
    const updatedKPIs = currentKPIs.map(k => {
      if (selectedKPIIds.has(k.id)) {
        let updated = { ...k };
        if (changes.status) updated.status = changes.status;
        if (changes.targetMultiplier) updated.target = Math.round(updated.target * changes.targetMultiplier);
        return updated;
      }
      return k;
    });
    setLocalKPIs(prev => ({ ...prev, [currentDept.id]: updatedKPIs }));
    setShowBulkEditModal(false);
    setIsBulkEditMode(false);
    setSelectedKPIIds(new Set());
  };

  const getFilteredAndSortedKPIs = () => {
    const rawKPIs = localKPIs[currentDept.id] || currentDept.kpis;
    let filtered = rawKPIs;
    if (filterStatus !== 'all') filtered = rawKPIs.filter(k => k.status === filterStatus);
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.label.localeCompare(b.label);
      if (sortBy === 'value') return (safeParseFloat(b.value) || 0) - (safeParseFloat(a.value) || 0);
      if (sortBy === 'change') return Math.abs(b.change) - Math.abs(a.change);
      return 0;
    });
  };

  if (!currentUser) return <AuthView onAuthSuccess={setCurrentUser} />;

  const displayedKPIs = getFilteredAndSortedKPIs();
  const canEdit = Permissions.canEditKPI(currentUser);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} user={currentUser} />
      
      {isGeneratorOpen && (
        <DashboardGeneratorModal 
          onClose={() => setIsGeneratorOpen(false)}
          onGenerate={newDept => { setDepartments(prev => [...prev, newDept]); setCurrentDept(newDept); }}
        />
      )}

      {isOnboardingOpen && (
        <OnboardingConcierge 
          onComplete={(profile) => { 
            console.log('Governance Active:', profile); 
            localStorage.setItem('int_onboarding_done', 'true');
            setIsOnboardingOpen(false); 
          }}
          onClose={() => { localStorage.setItem('int_onboarding_done', 'true'); setIsOnboardingOpen(false); }}
        />
      )}

      {isDocsOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm" onClick={() => setIsDocsOpen(false)}>
           <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-white">Documentation</h2>
                 <button onClick={() => setIsDocsOpen(false)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              <div className="p-8 overflow-y-auto prose prose-invert prose-sm max-w-none">
                <h3>Universal Dashboard Engine</h3>
                <p>Enterprise system for real-time monitoring and AI analysis.</p>
                <h4>Governance Controls</h4>
                <ul>
                  <li><strong>PII Scanning:</strong> Automatic detection on all prompt inputs.</li>
                  <li><strong>Model Binding:</strong> High-risk tasks are routed to Pro-tier models.</li>
                  <li><strong>Audit Logs:</strong> Every generation is tracked for compliance.</li>
                </ul>
              </div>
           </div>
        </div>
      )}
      
      {showBulkEditModal && <BulkKPIEditorModal count={selectedKPIIds.size} onClose={() => setShowBulkEditModal(false)} onSave={handleBulkSave} />}

      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">INT</div>
          <h1 className="font-bold text-lg text-white">Engine</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button onClick={() => setViewMode('dashboard')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-3 mb-6 ${viewMode === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Live Dashboard
          </button>
          {Permissions.canManageUsers(currentUser) && (
            <button onClick={() => setViewMode('management')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 mb-6 ${viewMode === 'management' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Access Control
            </button>
          )}
          <div className="flex justify-between items-center px-3 mb-2 mt-4">
             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Departments</div>
             <button onClick={() => setIsGeneratorOpen(true)} className="text-slate-500 hover:text-blue-400" title="Create Dashboard from Doc">
               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
             </button>
          </div>
          {departments.map(dept => (
            <button key={dept.id} onClick={() => setCurrentDept(dept)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentDept.id === dept.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              {dept.name}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-2">
           <button onClick={() => setIsDocsOpen(true)} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-300 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Documentation
           </button>
           <button onClick={() => setIsFeedbackOpen(true)} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-300 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
            Feedback
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-950 relative">
        <header className="sticky top-0 z-40 flex items-center justify-between p-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            <h2 className="text-xl font-bold text-white">{viewMode === 'dashboard' ? currentDept.name : 'Management'}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-800">
              <span className={`text-[10px] font-bold uppercase px-2 ${isLiveMode ? 'text-emerald-400' : 'text-slate-500'}`}>Live</span>
              <button onClick={() => setIsLiveMode(!isLiveMode)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isLiveMode ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <span className={`${isLiveMode ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
              </button>
            </div>
            {viewMode === 'dashboard' && <DepartmentSwitcher departments={departments} currentDept={currentDept} onSelect={setCurrentDept} />}
            <button onClick={handleLogout} className="text-xs font-bold text-rose-400 hover:text-rose-300">Sign Out</button>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {viewMode === 'dashboard' ? (
            <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${isRefreshing ? 'opacity-50' : ''}`}>
              {isBulkEditMode ? (
                <div className="bg-blue-600/10 border border-blue-500/50 rounded-2xl p-4 mb-6 flex justify-between items-center animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-xl shadow-lg"><svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></div>
                        <h3 className="text-lg font-bold text-white">{selectedKPIIds.size} KPIs Selected</h3>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={() => { setIsBulkEditMode(false); setSelectedKPIIds(new Set()); }} className="px-4 py-2 text-sm font-bold text-slate-300">Cancel</button>
                         <button onClick={() => setShowBulkEditModal(true)} disabled={selectedKPIIds.size === 0} className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl">Apply</button>
                    </div>
                </div>
              ) : (
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Overview</h3>
                  <div className="flex gap-2">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as FilterStatus)} className="bg-slate-800 text-white text-xs rounded border border-slate-700 px-2 py-1 outline-none">
                      <option value="all">All Status</option>
                      <option value="on-track">On Track</option>
                      <option value="at-risk">At Risk</option>
                      <option value="critical">Critical</option>
                    </select>
                    {canEdit && <button onClick={() => setIsBulkEditMode(true)} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-slate-700">Bulk Edit</button>}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {displayedKPIs.map(kpi => (
                  <KPICard key={kpi.id} kpi={kpi} currentUser={currentUser} onUpdate={u => updateKPI(currentDept.id, u)} isSelectMode={isBulkEditMode} isSelected={selectedKPIIds.has(kpi.id)} onToggleSelect={() => toggleSelectKPI(kpi.id)} />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Performance Index</h3>
                    <SimpleLineChart data={MOCK_CHART_DATA.performance} showTrend={showTrend} showTarget={showTarget} />
                  </div>
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Department Health Comparison</h3>
                    <DepartmentComparison departments={departments} localKPIs={localKPIs} />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-6 bg-indigo-950/10 border border-indigo-500/20 rounded-2xl">
                    <h3 className="text-lg font-bold text-indigo-100 mb-4 flex items-center gap-2">Intelligence</h3>
                    <AIInsightsView department={currentDept} />
                  </div>
                </div>
              </div>
            </div>
          ) : <UserManagement currentUser={currentUser} />}
        </div>
      </main>
    </div>
  );
};

export default App;
