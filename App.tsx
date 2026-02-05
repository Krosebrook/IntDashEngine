
import React, { useState, useEffect, useMemo } from 'react';
import { DEPARTMENTS, MOCK_CHART_DATA } from './lib/mockData';
import { DepartmentConfig, User, KPI } from './types';
import { Permissions } from './lib/permissions';
import DepartmentSwitcher from './components/DepartmentSwitcher';
import KPICard from './components/KPICard';
import AIInsightsView from './components/AIInsightsView';
import SimpleLineChart from './components/charts/SimpleLineChart';
import SimpleBarChart from './components/charts/SimpleBarChart';
import SimpleAreaChart from './components/charts/SimpleAreaChart';
import DepartmentComparison from './components/DepartmentComparison';
import BulkKPIEditorModal from './components/Editor/BulkKPIEditorModal';
import AuthView from './components/AuthView';
import FeedbackModal from './components/FeedbackModal';
import UserManagement from './components/Admin/UserManagement';

type ViewMode = 'dashboard' | 'management' | 'settings';
type ChartType = 'line' | 'bar' | 'area';
type FilterStatus = 'all' | 'on-track' | 'at-risk' | 'critical';
type SortOption = 'name' | 'value' | 'change';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentDept, setCurrentDept] = useState<DepartmentConfig>(DEPARTMENTS[DEPARTMENTS.length - 1]);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [localKPIs, setLocalKPIs] = useState<Record<string, KPI[]>>({});

  // Chart Controls
  const [chartType, setChartType] = useState<ChartType>('line');
  const [showTrend, setShowTrend] = useState(false);
  const [showTarget, setShowTarget] = useState(true);

  // New Feature States
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [selectedKPIIds, setSelectedKPIIds] = useState<Set<string>>(new Set());
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);

  // Filter & Sort States
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  useEffect(() => {
    const savedSession = localStorage.getItem('int_user_session');
    if (savedSession) {
      setCurrentUser(JSON.parse(savedSession));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('int_user_session');
    setCurrentUser(null);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate network request
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  const updateKPI = (deptId: string, updatedKPI: KPI) => {
    setLocalKPIs(prev => {
      const deptKPIs = prev[deptId] || DEPARTMENTS.find(d => d.id === deptId)?.kpis || [];
      return {
        ...prev,
        [deptId]: deptKPIs.map(k => k.id === updatedKPI.id ? updatedKPI : k)
      };
    });
  };

  // Bulk Edit Logic
  const toggleSelectKPI = (id: string) => {
    const newSet = new Set(selectedKPIIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedKPIIds(newSet);
  };

  const handleBulkExportCSV = () => {
    const currentKPIs = localKPIs[currentDept.id] || currentDept.kpis;
    const selected = currentKPIs.filter(k => selectedKPIIds.has(k.id));
    if (selected.length === 0) return;

    const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
    const headers = "ID,Label,Description,Value,Unit,Target,Status,Trend,Change\n";
    const rows = selected.map(kpi => {
        return `${kpi.id},${escape(kpi.label)},${escape(kpi.description || '')},${kpi.value},${kpi.unit},${kpi.target},${kpi.status},${kpi.trend},${kpi.change}`;
    }).join("\n");
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bulk_export_${currentDept.id}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    setLocalKPIs(prev => ({
      ...prev,
      [currentDept.id]: updatedKPIs
    }));
    
    setShowBulkEditModal(false);
    setIsBulkEditMode(false);
    setSelectedKPIIds(new Set());
  };

  const getFilteredAndSortedKPIs = () => {
    const rawKPIs = localKPIs[currentDept.id] || currentDept.kpis;
    
    // Filter
    let filtered = rawKPIs;
    if (filterStatus !== 'all') {
      filtered = rawKPIs.filter(k => k.status === filterStatus);
    }

    // Sort
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.label.localeCompare(b.label);
      if (sortBy === 'value') return (Number(b.value) || 0) - (Number(a.value) || 0); // Descending value
      if (sortBy === 'change') return Math.abs(b.change) - Math.abs(a.change); // Descending magnitude
      return 0;
    });
  };

  if (!currentUser) return <AuthView onAuthSuccess={setCurrentUser} />;

  const displayedKPIs = getFilteredAndSortedKPIs();
  const canEdit = Permissions.canEditKPI(currentUser);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
        user={currentUser}
      />

      {isDocsOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm" onClick={() => setIsDocsOpen(false)}>
           <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                 <h2 className="text-xl font-bold text-white">Documentation</h2>
                 <button onClick={() => setIsDocsOpen(false)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar prose prose-invert prose-sm max-w-none">
                <h3>Universal Dashboard Engine</h3>
                <p>Welcome to the INT Inc dashboard. This system is designed for real-time monitoring and AI-driven analysis.</p>
                
                <h4>Getting Started</h4>
                <ul>
                  <li><strong>Dashboard:</strong> View live KPIs for your selected department.</li>
                  <li><strong>AI Insights:</strong> Check the right sidebar for strategic insights generated by Gemini 3 Flash.</li>
                  <li><strong>History:</strong> Hover over any KPI card to see a 7-day sparkline. Click the clock icon for a 30-day view.</li>
                </ul>

                <h4>Power Features</h4>
                <ul>
                   <li><strong>Bulk Edit:</strong> Use the "Bulk Edit" button in the filter bar to select multiple KPIs and update them at once.</li>
                   <li><strong>Exports:</strong> Charts can be exported as PNG or SVG by hovering over the chart area.</li>
                </ul>
                
                <h4>Troubleshooting</h4>
                <p>If charts appear empty, ensure numeric values are entered for KPIs. The system attempts to parse currency ($) and percentages (%) automatically.</p>
              </div>
           </div>
        </div>
      )}
      
      {showBulkEditModal && (
        <BulkKPIEditorModal 
          count={selectedKPIIds.size}
          onClose={() => setShowBulkEditModal(false)}
          onSave={handleSave => handleBulkSave(handleSave)}
        />
      )}

      {/* Navigation Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20">INT</div>
          <h1 className="font-bold text-lg text-white">Engine</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-3 mb-6 ${viewMode === 'dashboard' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Live Dashboard
          </button>

          {Permissions.canManageUsers(currentUser) && (
            <>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Management</div>
              <button
                onClick={() => setViewMode('management')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 mb-6 ${viewMode === 'management' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Access Control
              </button>
            </>
          )}

          {viewMode === 'dashboard' && (
            <>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Departments</div>
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => setCurrentDept(dept)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentDept.id === dept.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  {dept.name}
                </button>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
           <button
            onClick={() => setIsDocsOpen(true)}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-300 flex items-center gap-2"
           >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Documentation
           </button>
           <button
            onClick={() => setIsFeedbackOpen(true)}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-300 flex items-center gap-2"
           >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Submit Feedback
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-950 relative custom-scrollbar">
        <header className="sticky top-0 z-40 flex items-center justify-between p-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            <h2 className="text-xl font-bold text-white hidden md:block">
              {viewMode === 'dashboard' ? currentDept.name : 'System Management'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
             {viewMode === 'dashboard' && (
               <button 
                onClick={handleRefresh}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                title="Refresh Data"
               >
                 <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
               </button>
             )}

            {viewMode === 'dashboard' && <DepartmentSwitcher currentDept={currentDept} onSelect={setCurrentDept} />}
            
            <div className="group relative">
              <button className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-800 transition-all border border-slate-800/50 bg-slate-900/50 pr-4">
                <div className="w-9 h-9 rounded-full border border-slate-700 overflow-hidden">
                  <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-white leading-none">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 mt-1 uppercase font-black tracking-widest">{currentUser.role}</div>
                </div>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 z-50">
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 font-bold">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {viewMode === 'dashboard' ? (
            <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}>
              
              {isBulkEditMode ? (
                <div className="bg-blue-600/10 border border-blue-500/50 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 animate-in fade-in slide-in-from-top-4 shadow-2xl shadow-blue-900/20">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Bulk Edit Mode</h3>
                            <p className="text-sm text-blue-200">{selectedKPIIds.size} KPI{selectedKPIIds.size !== 1 ? 's' : ''} selected</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                         <button onClick={() => { setIsBulkEditMode(false); setSelectedKPIIds(new Set()); }} className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                            Cancel
                         </button>
                         <button onClick={handleBulkExportCSV} disabled={selectedKPIIds.size === 0} className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all border border-slate-700 hover:border-slate-500 flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Export CSV
                         </button>
                         <button onClick={() => setShowBulkEditModal(true)} disabled={selectedKPIIds.size === 0} className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Apply Changes
                         </button>
                    </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span>Overview</span>
                    <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs">{displayedKPIs.length} KPIs</span>
                  </h3>

                  {/* KPI Controls: Filter & Sort */}
                  <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 px-2 border-r border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Status</span>
                      <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                        className="bg-slate-800 text-white text-xs rounded border border-slate-700 px-2 py-1 outline-none focus:border-blue-500"
                      >
                        <option value="all">All</option>
                        <option value="on-track">On Track</option>
                        <option value="at-risk">At Risk</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Sort</span>
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="bg-slate-800 text-white text-xs rounded border border-slate-700 px-2 py-1 outline-none focus:border-blue-500"
                      >
                        <option value="name">Name</option>
                        <option value="value">Highest Value</option>
                        <option value="change">Biggest Change</option>
                      </select>
                    </div>

                    {canEdit && (
                      <div className="border-l border-slate-800 pl-3">
                         <button 
                            onClick={() => setIsBulkEditMode(true)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Bulk Edit
                          </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {displayedKPIs.length > 0 ? (
                  displayedKPIs.map(kpi => (
                    <KPICard 
                      key={kpi.id} 
                      kpi={kpi} 
                      currentUser={currentUser} 
                      onUpdate={(updated) => updateKPI(currentDept.id, updated)}
                      isSelectMode={isBulkEditMode}
                      isSelected={selectedKPIIds.has(kpi.id)}
                      onToggleSelect={() => toggleSelectKPI(kpi.id)}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                    No KPIs match your current filters.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-white">Performance Index</h3>
                      <div className="flex items-center gap-3 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                        <div className="flex gap-1 border-r border-slate-700 pr-2 mr-2">
                           <button onClick={() => setChartType('line')} className={`p-1.5 rounded ${chartType === 'line' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`} title="Line Chart">
                             <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17l6-6 4 4 8-8" /></svg>
                           </button>
                           <button onClick={() => setChartType('bar')} className={`p-1.5 rounded ${chartType === 'bar' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`} title="Bar Chart">
                             <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4" /></svg>
                           </button>
                           <button onClick={() => setChartType('area')} className={`p-1.5 rounded ${chartType === 'area' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`} title="Area Chart">
                             <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17l6-6 4 4 8-8v10H3z" /></svg>
                           </button>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={showTarget} onChange={e => setShowTarget(e.target.checked)} className="w-3 h-3 rounded bg-slate-700 border-slate-600" />
                          <span className="text-xs text-slate-300 font-medium">Target</span>
                        </label>
                        {chartType === 'line' && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={showTrend} onChange={e => setShowTrend(e.target.checked)} className="w-3 h-3 rounded bg-slate-700 border-slate-600" />
                            <span className="text-xs text-slate-300 font-medium">Trend</span>
                          </label>
                        )}
                      </div>
                    </div>
                    
                    {chartType === 'line' && <SimpleLineChart data={MOCK_CHART_DATA.performance} showTrend={showTrend} showTarget={showTarget} />}
                    {chartType === 'bar' && <SimpleBarChart data={MOCK_CHART_DATA.performance} showTarget={showTarget} />}
                    {chartType === 'area' && <SimpleAreaChart data={MOCK_CHART_DATA.performance} showTarget={showTarget} />}
                  </div>

                  {/* Department Comparison Widget */}
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Department Health Score Comparison</h3>
                    <DepartmentComparison departments={DEPARTMENTS} localKPIs={localKPIs} />
                  </div>

                </div>
                <div className="space-y-6">
                  <div className="p-6 bg-indigo-950/10 border border-indigo-500/20 rounded-2xl">
                    <h3 className="text-lg font-bold text-indigo-100 mb-4 flex items-center gap-2">
                       <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                       AI Intelligence
                    </h3>
                    <AIInsightsView department={currentDept} />
                  </div>
                </div>
              </div>
            </div>
          ) : viewMode === 'management' ? (
            <UserManagement currentUser={currentUser} />
          ) : (
             <div className="p-12 text-center text-slate-500 italic">Settings module under deployment...</div>
          )}
        </div>
      </main>

      {/* Mobile Drawer */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <aside className="relative w-80 bg-slate-900 border-r border-slate-800 flex flex-col p-6 space-y-4">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">INT</div>
                  <span className="text-white font-bold">Engine</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-500">✕</button>
             </div>
             <button onClick={() => { setViewMode('dashboard'); setSidebarOpen(false); }} className="w-full text-left px-4 py-3 bg-slate-800 rounded-xl text-white font-bold">Dashboard</button>
             {Permissions.canManageUsers(currentUser) && (
                <button onClick={() => { setViewMode('management'); setSidebarOpen(false); }} className="w-full text-left px-4 py-3 bg-indigo-900/50 rounded-xl text-indigo-300 font-bold border border-indigo-800">Management</button>
             )}
          </aside>
        </div>
      )}
    </div>
  );
};

export default App;
