
import React from 'react';
import { User, UserRole } from '../types';
import AuthService from '../authService';

interface SidebarProps {
  user: User;
  realUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, realUser, activeTab, setActiveTab, onLogout }) => {
  const visibleUsers = AuthService.getVisibleUsers(user);
  const canViewLogs = AuthService.canViewLogs(user);
  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: '📊' },
    ...(visibleUsers.length > 0 ? [{ id: 'users', label: 'Portfolios', icon: '💼' }] : []),
    ...(isSuperAdmin ? [{ id: 'permissions', label: 'Permissions', icon: '🔒' }] : []),
    ...(canViewLogs ? [{ id: 'logs', label: 'Compliance', icon: '🛡️' }] : []),
  ];

  return (
    <aside className="w-80 bg-navy-950/50 backdrop-blur-3xl border-r border-white/5 flex flex-col hidden md:flex shrink-0 relative z-20">
      <div className="p-10">
        <div className="flex items-center space-x-4 mb-12">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white italic shadow-lg shadow-blue-500/20">V</div>
          <span className="font-black tracking-tight text-2xl text-white">FIN-VAULT</span>
        </div>
        
        <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">{user.role.replace('_', ' ')}</p>
          <p className="font-black text-lg text-white truncate">{user.name}</p>
          <div className="mt-4 flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Node</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all relative group ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {activeTab === item.id && (
              <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full"></div>
            )}
            <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-10">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-4 px-6 py-4 text-slate-500 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 rounded-2xl transition-all border border-transparent"
        >
          <span className="text-xl">🚪</span>
          <span className="font-black text-xs uppercase tracking-widest">End Session</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
