
import React, { useState, useEffect } from 'react';
import { User, UserRole, AuthState, AuditLog } from './types';
import { users, getAuditLogs, addAuditLog } from './db';
import AuthService from './authService';
import Sidebar from './components/Sidebar';
import AdminPanel from './components/AdminPanel';
import AssociateDashboard from './components/AssociateDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import ImpersonationBanner from './components/ImpersonationBanner';
import PermissionTable from './components/PermissionTable';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ currentUser: null, actingUser: null, isImpersonating: false });
  const [activeTab, setActiveTab] = useState('dashboard');

  const currentUser = auth.currentUser;
  const actingUser = auth.actingUser;

  // Access Control Redirect: Role Permissions ONLY for SUPER_ADMIN
  useEffect(() => {
    if (activeTab === 'permissions' && currentUser?.role !== UserRole.SUPER_ADMIN) {
      setActiveTab('dashboard');
    }
  }, [activeTab, currentUser]);

  const handleLogin = (id: string) => {
    const user = AuthService.login(id);
    if (user) {
      setAuth({ currentUser: user, actingUser: user, isImpersonating: false });
      setActiveTab('dashboard');
    }
  };

  const handleImpersonate = (targetUser: User) => {
    if (!actingUser) return;
    if (AuthService.canImpersonate(actingUser, targetUser)) {
      addAuditLog({ 
        actorId: actingUser.id, 
        actingAsId: targetUser.id, 
        action: 'IMPERSONATION_START', 
        details: `${actingUser.name} started impersonating ${targetUser.name}`, 
        timestamp: new Date().toISOString(), 
        severity: 'WARNING' 
      });
      setAuth({ ...auth, currentUser: targetUser, isImpersonating: true });
      setActiveTab('dashboard');
    } else {
      addAuditLog({ 
        actorId: actingUser.id, 
        targetId: targetUser.id, 
        action: 'IMPERSONATION_DENIED', 
        details: `Unauthorized impersonation attempt by ${actingUser.name} on ${targetUser.name}`, 
        timestamp: new Date().toISOString(), 
        severity: 'CRITICAL' 
      });
      alert("Unauthorized impersonation attempt. Security violation logged.");
    }
  };

  const stopImpersonation = () => {
    if (!actingUser || !currentUser) return;
    addAuditLog({ actorId: actingUser.id, actingAsId: currentUser.id, action: 'IMPERSONATION_STOP', details: `${actingUser.name} stopped impersonating ${currentUser.name}`, timestamp: new Date().toISOString(), severity: 'INFO' });
    setAuth({ ...auth, currentUser: actingUser, isImpersonating: false });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#070A14] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Dynamic Background Accents */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="glass p-10 max-w-lg w-full rounded-[32px] border-white/5 shadow-2xl relative z-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
              <span className="text-3xl font-black text-white italic">V</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Fin-Vault</h1>
            <p className="text-slate-400 font-medium">Wealth management for the next generation.</p>
          </div>
          
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 text-center">Identity Selection Core</label>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {users.map(u => (
                <button 
                  key={u.id} 
                  onClick={() => handleLogin(u.id)} 
                  className="w-full flex items-center justify-between p-5 glass glass-hover rounded-2xl transition-all group border-white/5 hover:border-white/20"
                >
                  <div className="text-left flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sm font-bold text-slate-300 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all">
                      {u.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-100 group-hover:text-white">{u.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{u.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 text-blue-400 font-bold text-xs translate-x-2 group-hover:translate-x-0 transition-all">
                    LOG IN
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <p className="mt-8 text-center text-xs text-slate-600 font-medium">
            Authorized Personnel Only • Secure Protocol Active
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#070A14] text-slate-100 selection:bg-blue-500/30">
      {auth.isImpersonating && actingUser && (
        <ImpersonationBanner actingUser={actingUser} currentUser={currentUser} onStop={stopImpersonation} />
      )}
      
      <Sidebar user={currentUser} realUser={actingUser!} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setAuth({ currentUser: null, actingUser: null, isImpersonating: false })} />

      <main className={`flex-1 overflow-auto transition-all relative ${auth.isImpersonating ? 'pt-14' : ''}`}>
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="p-6 md:p-12 max-w-[1400px] mx-auto relative z-10">
          {activeTab === 'dashboard' && (
            <>
              {(currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.ADMIN) && (
                <AdminPanel actor={currentUser} onImpersonate={handleImpersonate} isDashboardView={true} />
              )}
              {currentUser.role === UserRole.ASSOCIATE && (
                <AssociateDashboard associate={currentUser} onImpersonate={handleImpersonate} />
              )}
              {currentUser.role === UserRole.CUSTOMER && (
                <CustomerDashboard customer={currentUser} actingUser={actingUser!} />
              )}
            </>
          )}

          {activeTab === 'users' && (
            <AdminPanel actor={currentUser} onImpersonate={handleImpersonate} isDashboardView={false} />
          )}

          {activeTab === 'permissions' && currentUser.role === UserRole.SUPER_ADMIN && (
            <PermissionTable currentUser={currentUser} />
          )}

          {activeTab === 'logs' && AuthService.canViewLogs(currentUser) && (
            <div className="glass rounded-[32px] p-8 border-white/5 animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-white tracking-tight">System Compliance</h2>
                <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest">Live Audit</div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left">
                      <th className="pb-6 px-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Executor</th>
                      <th className="pb-6 px-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Operation</th>
                      <th className="pb-6 px-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Record Trace</th>
                      <th className="pb-6 px-4 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {getAuditLogs().map((log) => {
                      const actor = users.find(u => u.id === log.actorId);
                      return (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                          <td className="py-6 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xs text-slate-400">{actor?.name[0]}</div>
                              <div>
                                <p className="font-bold text-slate-200 group-hover:text-white">{actor?.name}</p>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{actor?.role.replace('_', ' ')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-6 px-4">
                            <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-black text-[9px] uppercase tracking-widest border border-blue-500/20">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-6 px-4 text-slate-400 text-xs font-medium italic group-hover:text-slate-300 transition-colors">
                            {log.details}
                          </td>
                          <td className="py-6 px-4 text-slate-500 text-[10px] font-bold text-right uppercase tracking-widest">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
