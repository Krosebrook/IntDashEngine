
import React, { useState, useEffect } from 'react';
import { DEPARTMENTS, MOCK_CHART_DATA } from './lib/mockData';
import { DepartmentConfig, User, KPI } from './types';
import { Permissions } from './lib/permissions';
import DepartmentSwitcher from './components/DepartmentSwitcher';
import KPICard from './components/KPICard';
import AIInsightsView from './components/AIInsightsView';
import SimpleLineChart from './components/charts/SimpleLineChart';
import AuthView from './components/AuthView';
import FeedbackModal from './components/FeedbackModal';
import UserManagement from './components/Admin/UserManagement';

type ViewMode = 'dashboard' | 'management' | 'settings';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentDept, setCurrentDept] = useState<DepartmentConfig>(DEPARTMENTS[DEPARTMENTS.length - 1]);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [localKPIs, setLocalKPIs] = useState<Record<string, KPI[]>>({});

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

  const updateKPI = (deptId: string, updatedKPI: KPI) => {
    setLocalKPIs(prev => {
      const deptKPIs = prev[deptId] || DEPARTMENTS.find(d => d.id === deptId)?.kpis || [];
      return {
        ...prev,
        [deptId]: deptKPIs.map(k => k.id === updatedKPI.id ? updatedKPI : k)
      };
    });
  };

  if (!currentUser) return <AuthView onAuthSuccess={setCurrentUser} />;

  const displayedKPIs = localKPIs[currentDept.id] || currentDept.kpis;

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
        user={currentUser}
      />

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
          
          <div className="flex items-center gap-6">
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
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {displayedKPIs.map(kpi => (
                  <KPICard 
                    key={kpi.id} 
                    kpi={kpi} 
                    currentUser={currentUser} 
                    onUpdate={(updated) => updateKPI(currentDept.id, updated)}
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Performance Index</h3>
                    <SimpleLineChart data={MOCK_CHART_DATA.performance} />
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
