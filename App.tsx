
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DEPARTMENTS as INITIAL_DEPARTMENTS, MOCK_CHART_DATA } from './lib/mockData';
import { DepartmentConfig, User, KPI } from './types';
import { Permissions } from './lib/permissions';
import { safeParseFloat } from './lib/utils';
import { db } from './lib/db'; // Import IndexedDB wrapper
import DepartmentSwitcher from './components/DepartmentSwitcher';
import KPICard from './components/KPICard';
import AIInsightsView from './components/AIInsightsView';
import SimpleLineChart from './components/charts/SimpleLineChart';
import DepartmentComparison from './components/DepartmentComparison';
import DashboardGeneratorModal from './components/DashboardGeneratorModal';
import BulkKPIEditorModal from './components/Editor/BulkKPIEditorModal';
import OnboardingConcierge from './components/Onboarding/OnboardingConcierge';
import AuthView from './components/AuthView';
import FeedbackModal from './components/FeedbackModal';
import UserManagement from './components/Admin/UserManagement';
import CacheDiagnostics from './components/Admin/CacheDiagnostics';

type ViewMode = 'dashboard' | 'management' | 'settings';
type ManagementTab = 'users' | 'system';
type FilterStatus = 'all' | 'on-track' | 'at-risk' | 'critical';
type SortOption = 'name' | 'value' | 'change';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<DepartmentConfig[]>(INITIAL_DEPARTMENTS);
  const [currentDept, setCurrentDept] = useState<DepartmentConfig>(INITIAL_DEPARTMENTS[INITIAL_DEPARTMENTS.length - 1]);
  const [localKPIs, setLocalKPIs] = useState<Record<string, KPI[]>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [managementTab, setManagementTab] = useState<ManagementTab>('users');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  
  // Bulk Edit State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedKPIs, setSelectedKPIs] = useState<Set<string>>(new Set());
  const [isBulkEditorOpen, setIsBulkEditorOpen] = useState(false);

  // PWA Specific States
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const liveIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('int_user_session');
    if (savedSession) {
      setCurrentUser(JSON.parse(savedSession));
      if (!localStorage.getItem('int_onboarding_done')) {
        setIsOnboardingOpen(true);
      }
    }

    // Load initial data from DB for all departments
    const loadFromDB = async () => {
      const kpiMap: Record<string, KPI[]> = {};
      for (const dept of INITIAL_DEPARTMENTS) {
        const stored = await db.getKPIs(dept.id);
        if (stored) {
          kpiMap[dept.id] = stored;
        } else {
          // Initialize DB if empty
          await db.saveKPIs(dept.id, dept.kpis);
        }
      }
      if (Object.keys(kpiMap).length > 0) {
        setLocalKPIs(kpiMap);
      }
    };
    loadFromDB();

    // PWA: Update Detection
    const handleUpdate = () => setShowUpdateBanner(true);
    window.addEventListener('pwa-update-available', handleUpdate);

    // PWA: Install Prompt Detection
    const handleInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('pwa-update-available', handleUpdate);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  useEffect(() => {
    // Clear selection when changing departments
    setSelectedKPIs(new Set());
    setIsSelectMode(false);
  }, [currentDept.id]);

  useEffect(() => {
    if (isLiveMode) {
      const simulateLiveUpdates = () => {
        setLocalKPIs(prev => {
          const deptId = currentDept.id;
          const currentKPIs = prev[deptId] || currentDept.kpis;
          const updatedList = currentKPIs.map((kpi) => {
            if (Math.random() > 0.7 && typeof kpi.value === 'number') {
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
    } else if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    return () => { if (liveIntervalRef.current) clearInterval(liveIntervalRef.current); };
  }, [isLiveMode, currentDept.id, currentDept.kpis]);

  const handleUpdateReload = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
      });
    }
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted install');
    }
    setInstallPrompt(null);
    setShowInstallBanner(false);
  };

  const updateKPI = async (deptId: string, updatedKPI: KPI) => {
    setLocalKPIs(prev => {
      const deptKPIs = prev[deptId] || departments.find(d => d.id === deptId)?.kpis || [];
      const newList = deptKPIs.map(k => k.id === updatedKPI.id ? updatedKPI : k);
      db.saveKPIs(deptId, newList).catch(console.error);
      return { ...prev, [deptId]: newList };
    });
  };

  const handleAddKPI = async (deptId: string, newKPI: KPI) => {
    setLocalKPIs(prev => {
      const deptKPIs = prev[deptId] || departments.find(d => d.id === deptId)?.kpis || [];
      // Prevent duplicates
      if (deptKPIs.some(k => k.label === newKPI.label)) return prev;
      const newList = [...deptKPIs, newKPI];
      db.saveKPIs(deptId, newList).catch(console.error);
      return { ...prev, [deptId]: newList };
    });
  };

  const toggleSelection = (kpiId: string) => {
    setSelectedKPIs(prev => {
      const next = new Set(prev);
      if (next.has(kpiId)) next.delete(kpiId);
      else next.add(kpiId);
      return next;
    });
  };

  const handleBulkSave = async (changes: { status?: 'on-track' | 'at-risk' | 'critical', targetMultiplier?: number }) => {
    const deptId = currentDept.id;
    
    setLocalKPIs(prev => {
      const currentList = prev[deptId] || departments.find(d => d.id === deptId)?.kpis || [];
      const updatedList = currentList.map(kpi => {
        if (selectedKPIs.has(kpi.id)) {
          let updates: Partial<KPI> = {};
          if (changes.status) updates.status = changes.status;
          if (changes.targetMultiplier !== undefined) {
             updates.target = Number((kpi.target * changes.targetMultiplier).toFixed(2));
          }
          return { ...kpi, ...updates };
        }
        return kpi;
      });

      // Side effect: Save to DB
      db.saveKPIs(deptId, updatedList).catch(console.error);
      return { ...prev, [deptId]: updatedList };
    });

    setIsBulkEditorOpen(false);
    setIsSelectMode(false);
    setSelectedKPIs(new Set());
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
  
  const effectiveDept = { 
    ...currentDept, 
    kpis: localKPIs[currentDept.id] || currentDept.kpis 
  };

  const isAdmin = Permissions.canManageUsers(currentUser);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      {/* PWA Update Banner */}
      {showUpdateBanner && (
        <div className="fixed bottom-6 right-6 z-[200] bg-blue-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10">
          <div className="text-sm font-bold">New Version Available</div>
          <button onClick={handleUpdateReload} className="px-4 py-2 bg-white text-blue-600 text-xs font-black rounded-lg hover:bg-blue-50 transition-colors">Reload Now</button>
          <button onClick={() => setShowUpdateBanner(false)} className="text-white/60 hover:text-white">✕</button>
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 px-5 py-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-full shadow-2xl animate-in slide-in-from-top-10">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-xs font-bold text-white">Install App</span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <button 
            onClick={handleInstallClick}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Install
          </button>
          <button 
            onClick={() => setShowInstallBanner(false)}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} user={currentUser} />
      {isGeneratorOpen && <DashboardGeneratorModal onClose={() => setIsGeneratorOpen(false)} onGenerate={newDept => { setDepartments(prev => [...prev, newDept]); setCurrentDept(newDept); }} />}
      {isOnboardingOpen && <OnboardingConcierge onComplete={() => { localStorage.setItem('int_onboarding_done', 'true'); setIsOnboardingOpen(false); }} onClose={() => setIsOnboardingOpen(false)} />}
      
      {isBulkEditorOpen && (
        <BulkKPIEditorModal 
          count={selectedKPIs.size} 
          onSave={handleBulkSave} 
          onClose={() => setIsBulkEditorOpen(false)} 
        />
      )}

      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">INT</div>
          <h1 className="font-bold text-lg text-white">Engine</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button onClick={() => setViewMode('dashboard')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-3 mb-4 ${viewMode === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Dashboard</button>
          
          {isAdmin && (
            <button onClick={() => setViewMode('management')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-3 mb-6 ${viewMode === 'management' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Admin Portal</button>
          )}

          <div className="pt-4 border-t border-slate-800/50 mt-4 space-y-1">
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Departments</div>
            {departments.map(dept => (
              <button key={dept.id} onClick={() => { setCurrentDept(dept); setViewMode('dashboard'); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentDept.id === dept.id && viewMode === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800'}`}>{dept.name}</button>
            ))}
          </div>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-950 relative">
        <header className="sticky top-0 z-40 flex items-center justify-between p-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">{viewMode === 'dashboard' ? currentDept.name : 'Admin Portal'}</h2>
            {viewMode === 'management' && (
              <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button 
                  onClick={() => setManagementTab('users')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${managementTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Users
                </button>
                <button 
                  onClick={() => setManagementTab('system')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${managementTab === 'system' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  System
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
             {Permissions.canEditKPI(currentUser) && viewMode === 'dashboard' && (
              <button 
                 onClick={() => { 
                    setIsSelectMode(!isSelectMode); 
                    if (isSelectMode) setSelectedKPIs(new Set()); 
                 }}
                 className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${isSelectMode ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' : 'text-slate-400 border-slate-800 hover:bg-slate-900'}`}
              >
                {isSelectMode ? 'Cancel Selection' : 'Bulk Edit'}
              </button>
            )}
            <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-800">
              <span className={`text-[10px] font-bold uppercase px-2 ${isLiveMode ? 'text-emerald-400' : 'text-slate-500'}`}>Live</span>
              <button onClick={() => setIsLiveMode(!isLiveMode)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isLiveMode ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <span className={`${isLiveMode ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
              </button>
            </div>
            {viewMode === 'dashboard' && <DepartmentSwitcher departments={departments} currentDept={currentDept} onSelect={setCurrentDept} />}
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto w-full space-y-6 pb-24">
          {viewMode === 'dashboard' ? (
            <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${isRefreshing ? 'opacity-50' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {displayedKPIs.map(kpi => (
                  <KPICard 
                    key={kpi.id} 
                    kpi={kpi} 
                    currentUser={currentUser} 
                    departmentName={currentDept.name} 
                    departmentDescription={currentDept.description}
                    onUpdate={u => updateKPI(currentDept.id, u)}
                    onAddKPI={nk => handleAddKPI(currentDept.id, nk)}
                    isSelectMode={isSelectMode}
                    isSelected={selectedKPIs.has(kpi.id)}
                    onToggleSelect={() => toggleSelection(kpi.id)}
                  />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Performance Index</h3>
                    <SimpleLineChart data={MOCK_CHART_DATA.performance} showTarget />
                  </div>
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Health Comparison</h3>
                    <DepartmentComparison departments={departments} localKPIs={localKPIs} />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-6 bg-indigo-950/10 border border-indigo-500/20 rounded-2xl">
                    <h3 className="text-lg font-bold text-indigo-100 mb-4 flex items-center gap-2">Intelligence</h3>
                    <AIInsightsView department={effectiveDept} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            managementTab === 'users' ? <UserManagement currentUser={currentUser} /> : <CacheDiagnostics />
          )}
        </div>
        
        {/* Floating Bulk Action Bar */}
        {isSelectMode && selectedKPIs.size > 0 && (
           <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 p-2 pr-3 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-lg">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-bold text-white">{selectedKPIs.size} selected</span>
              </div>
              <button 
                onClick={() => setIsBulkEditorOpen(true)} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
              >
                Edit Selected
              </button>
              <button 
                onClick={() => setSelectedKPIs(new Set())}
                className="p-2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;
