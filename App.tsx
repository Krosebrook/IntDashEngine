
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
import OnboardingConcierge from './components/Onboarding/OnboardingConcierge';
import AuthView from './components/AuthView';
import FeedbackModal from './components/FeedbackModal';
import UserManagement from './components/Admin/UserManagement';

type ViewMode = 'dashboard' | 'management' | 'settings';
type FilterStatus = 'all' | 'on-track' | 'at-risk' | 'critical';
type SortOption = 'name' | 'value' | 'change';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<DepartmentConfig[]>(INITIAL_DEPARTMENTS);
  const [currentDept, setCurrentDept] = useState<DepartmentConfig>(INITIAL_DEPARTMENTS[INITIAL_DEPARTMENTS.length - 1]);
  const [localKPIs, setLocalKPIs] = useState<Record<string, KPI[]>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  
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
        <div className="fixed top-20 right-6 z-[200] bg-slate-900 border border-slate-700 text-white p-4 rounded-2xl shadow-2xl flex flex-col gap-3 animate-in slide-in-from-top-10 max-w-[280px]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">INT</div>
            <div className="text-xs font-bold">Install Dashboard Engine</div>
          </div>
          <p className="text-[10px] text-slate-400">Add to home screen for real-time monitoring and full-screen experience.</p>
          <div className="flex gap-2">
            <button onClick={handleInstallClick} className="flex-1 py-2 bg-blue-600 text-white text-[10px] font-bold rounded-lg">Install</button>
            <button onClick={() => setShowInstallBanner(false)} className="px-3 py-2 text-slate-500 text-[10px]">Later</button>
          </div>
        </div>
      )}

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} user={currentUser} />
      {isGeneratorOpen && <DashboardGeneratorModal onClose={() => setIsGeneratorOpen(false)} onGenerate={newDept => { setDepartments(prev => [...prev, newDept]); setCurrentDept(newDept); }} />}
      {isOnboardingOpen && <OnboardingConcierge onComplete={() => { localStorage.setItem('int_onboarding_done', 'true'); setIsOnboardingOpen(false); }} onClose={() => setIsOnboardingOpen(false)} />}
      
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">INT</div>
          <h1 className="font-bold text-lg text-white">Engine</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button onClick={() => setViewMode('dashboard')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-3 mb-6 ${viewMode === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Dashboard</button>
          {Permissions.canManageUsers(currentUser) && (
            <button onClick={() => setViewMode('management')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 mb-6 ${viewMode === 'management' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Access Control</button>
          )}
          {departments.map(dept => (
            <button key={dept.id} onClick={() => setCurrentDept(dept)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentDept.id === dept.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>{dept.name}</button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-950 relative">
        <header className="sticky top-0 z-40 flex items-center justify-between p-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
          <h2 className="text-xl font-bold text-white">{viewMode === 'dashboard' ? currentDept.name : 'Management'}</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-800">
              <span className={`text-[10px] font-bold uppercase px-2 ${isLiveMode ? 'text-emerald-400' : 'text-slate-500'}`}>Live</span>
              <button onClick={() => setIsLiveMode(!isLiveMode)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isLiveMode ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <span className={`${isLiveMode ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
              </button>
            </div>
            {viewMode === 'dashboard' && <DepartmentSwitcher departments={departments} currentDept={currentDept} onSelect={setCurrentDept} />}
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {viewMode === 'dashboard' ? (
            <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${isRefreshing ? 'opacity-50' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {displayedKPIs.map(kpi => (
                  <KPICard 
                    key={kpi.id} 
                    kpi={kpi} 
                    currentUser={currentUser} 
                    departmentName={currentDept.name} 
                    onUpdate={u => updateKPI(currentDept.id, u)}
                    onAddKPI={nk => handleAddKPI(currentDept.id, nk)}
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
          ) : <UserManagement currentUser={currentUser} />}
        </div>
      </main>
    </div>
  );
};

export default App;
