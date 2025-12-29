
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { users, addAuditLog, getFamilyMembers, addUser, updateUser, deleteUser } from '../db';
import AuthService from '../authService';

interface AdminPanelProps {
  actor: User;
  onImpersonate: (user: User) => void;
  isDashboardView: boolean;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ actor, onImpersonate, isDashboardView }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [manageUser, setManageUser] = useState<User | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const visibleUsers = AuthService.getVisibleUsers(actor);
  const filteredUsers = visibleUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = AuthService.hasPermission(actor, 'EDIT_CUSTOMERS');
  const canDelete = AuthService.hasPermission(actor, 'DELETE_CASCADE');

  const handleCreateUser = (newUser: User) => {
    addUser(newUser);
    addAuditLog({
      actorId: actor.id,
      action: 'USER_CREATE',
      details: `Created new user: ${newUser.name} with role ${newUser.role}`,
      timestamp: new Date().toISOString(),
      severity: 'INFO'
    });
    setIsAddingUser(false);
    setRefresh(r => r + refresh + 1);
  };

  const handleUpdateUser = (id: string, updates: Partial<User>) => {
    updateUser(id, updates);
    addAuditLog({
      actorId: actor.id,
      action: 'USER_UPDATE',
      details: `Updated user ${id} details`,
      timestamp: new Date().toISOString(),
      severity: 'INFO'
    });
    setManageUser(null);
    setRefresh(r => r + 1);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action is irreversible.`)) {
      deleteUser(id);
      addAuditLog({
        actorId: actor.id,
        action: 'USER_DELETE',
        details: `Deleted user: ${name} (${id})`,
        timestamp: new Date().toISOString(),
        severity: 'CRITICAL'
      });
      setRefresh(r => r + 1);
    }
  };

  if (isDashboardView) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <header className="flex justify-between items-center">
            <h1 className="text-4xl font-black text-white tracking-tighter">System Overview</h1>
            <div className="px-4 py-2 glass rounded-2xl border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Node ID: <span className="text-blue-400">{actor.name.split(' ')[0]}</span>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-10 rounded-[40px] border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 text-8xl opacity-[0.03] translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform">👥</div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Entity Registry</p>
             <p className="text-6xl font-black text-white tracking-tighter">{visibleUsers.filter(u => u.role === UserRole.CUSTOMER).length}</p>
          </div>
          <div className="glass p-10 rounded-[40px] border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 text-8xl opacity-[0.03] translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform">🛡️</div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Active Units</p>
             <p className="text-6xl font-black text-blue-500 tracking-tighter">{visibleUsers.filter(u => u.role !== UserRole.CUSTOMER).length}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 rounded-[40px] shadow-2xl shadow-blue-600/20 text-white relative overflow-hidden group">
             <div className="relative z-10">
               <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2">Security Protocol</p>
               <p className="text-6xl font-black tracking-tighter">HARDENED</p>
             </div>
             <div className="absolute top-0 right-0 p-8 text-9xl opacity-20 translate-x-1/4 -translate-y-1/4 pointer-events-none group-hover:scale-110 transition-transform">🛡️</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="glass rounded-[40px] border-white/5 overflow-hidden">
        <div className="p-10 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white/[0.01]">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter">Registry Console</h2>
            <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px] mt-2">Managing tier capabilities and entity nodes</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Identity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 pr-8 py-5 glass border-white/5 rounded-[24px] w-full md:w-[350px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all text-sm font-medium text-white placeholder:text-slate-600 outline-none"
              />
              <span className="absolute left-6 top-5 opacity-30 text-xl">🔍</span>
            </div>
            {canEdit && (
              <button 
                onClick={() => setIsAddingUser(true)}
                className="bg-blue-600 text-white px-8 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 border border-blue-500/30"
              >
                + New Node
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-white/5">
                <th className="py-8 px-10 font-black text-slate-500 uppercase tracking-widest text-[10px]">Identity Label</th>
                <th className="py-8 px-10 font-black text-slate-500 uppercase tracking-widest text-[10px]">Auth Tier</th>
                <th className="py-8 px-10 font-black text-slate-500 uppercase tracking-widest text-[10px]">Registry State</th>
                <th className="py-8 px-10 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Access Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                  <td className="py-8 px-10">
                    <div className="flex items-center space-x-5">
                       <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 shadow-inner flex items-center justify-center font-black text-slate-400 text-lg group-hover:border-blue-500/30 group-hover:text-blue-400 transition-all">
                          {u.name[0]}
                       </div>
                       <div>
                         <p className="font-black text-slate-100 text-lg group-hover:text-white">{u.name}</p>
                         <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                       </div>
                    </div>
                  </td>
                  <td className="py-8 px-10">
                    <span className={`px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border ${
                        u.role === UserRole.CUSTOMER 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                        {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-8 px-10">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active State</span>
                    </div>
                  </td>
                  <td className="py-8 px-10 text-right space-x-4">
                    {canEdit && (
                      <button 
                        onClick={() => setManageUser(u)}
                        className="text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                      >
                        Node Specs
                      </button>
                    )}
                    {AuthService.canImpersonate(actor, u) && (
                      <button
                        onClick={() => onImpersonate(u)}
                        className="bg-white/5 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl hover:shadow-blue-600/20 border border-white/5 hover:border-blue-500"
                      >
                        Enter Node
                      </button>
                    )}
                    {canDelete && (
                      <button 
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="text-red-500/40 hover:text-red-500 transition-colors"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddingUser && (
        <UserManagementModal 
          onClose={() => setIsAddingUser(false)}
          onSave={handleCreateUser}
          mode="CREATE"
        />
      )}

      {manageUser && (
        <UserManagementModal 
          user={manageUser}
          onClose={() => setManageUser(null)}
          onSave={(updates) => handleUpdateUser(manageUser.id, updates)}
          mode="EDIT"
        />
      )}
    </div>
  );
};

const UserManagementModal: React.FC<{ 
  user?: User; 
  onClose: () => void; 
  onSave: (u: any) => void;
  mode: 'CREATE' | 'EDIT';
}> = ({ user, onClose, onSave, mode }) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState<UserRole>(user?.role || UserRole.CUSTOMER);
  const [assignedTo, setAssignedTo] = useState(user?.assignedTo || '');

  const associates = users.filter(u => u.role === UserRole.ASSOCIATE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    onSave({
      id: user?.id || Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
      assignedTo: role === UserRole.CUSTOMER ? assignedTo : undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-[#070A14]/90 backdrop-blur-xl z-[300] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
      <div className="glass rounded-[48px] border-white/10 w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <h3 className="text-3xl font-black text-white tracking-tighter">{mode === 'CREATE' ? 'Onboard Node' : 'Node Configuration'}</h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Node Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl text-sm text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all outline-none"
              placeholder="e.g. Frank Family Node"
              required
            />
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Endpoint Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl text-sm text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all outline-none"
              placeholder="vault@node.io"
              required
            />
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Tier Rank</label>
            <select 
              value={role} 
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl text-sm text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all outline-none appearance-none"
              disabled={user?.id === 'a'}
            >
              {Object.values(UserRole).map(r => <option key={r} value={r} className="bg-navy-950">{r.replace('_', ' ')}</option>)}
            </select>
          </div>

          {role === UserRole.CUSTOMER && (
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cluster Associate</label>
              <select 
                value={assignedTo} 
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl text-sm text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all outline-none appearance-none"
              >
                <option value="" className="bg-navy-950">None Assigned</option>
                {associates.map(a => <option key={a.id} value={a.id} className="bg-navy-950">{a.name}</option>)}
              </select>
            </div>
          )}

          <div className="pt-6">
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 border border-blue-500/30"
            >
              {mode === 'CREATE' ? 'Commit Registry Entry' : 'Update Node Specs'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;
