
import React, { useState, useEffect } from 'react';
import { UserRole, PermissionKey, RolePermission } from '../types';
import { getRolePermissions, updateRolePermission, addAuditLog } from '../db';

interface PermissionTableProps {
  currentUser: { id: string; name: string };
}

const COLUMNS: { id: PermissionKey; label: string }[] = [
  { id: 'ADMIN_MODULES', label: 'Admin Modules' },
  { id: 'ASSOCIATES', label: 'Associates' },
  { id: 'CUSTOMERS', label: 'Customers' },
  { id: 'WHOLE_FAMILY', label: 'Whole Family' },
  { id: 'EDIT_CUSTOMERS', label: 'Edit' },
  { id: 'DELETE_CASCADE', label: 'Delete' },
  { id: 'DOWNLOAD_PDF', label: 'PDF' },
];

const ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.ASSOCIATE,
  UserRole.CUSTOMER
];

const PermissionTable: React.FC<PermissionTableProps> = ({ currentUser }) => {
  const [matrix, setMatrix] = useState<RolePermission[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // API Call: GET /permissions
    setMatrix(getRolePermissions());
  }, []);

  const handleToggle = async (role: UserRole, key: PermissionKey, currentValue: boolean) => {
    const lockKey = `${role}-${key}`;
    setSaving(lockKey);

    // Simulated API call persistence
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // API Call: POST /permissions/update
    const success = updateRolePermission(role, key, !currentValue);

    if (success) {
      setMatrix(getRolePermissions());
      addAuditLog({
        actorId: currentUser.id,
        action: 'MATRIX_UPDATE',
        details: `Updated ${role} capability: ${key} = ${!currentValue}`,
        timestamp: new Date().toISOString(),
        severity: 'WARNING'
      });
      setToast(`${role}: ${key} successfully committed.`);
      setTimeout(() => setToast(null), 3000);
    }
    setSaving(null);
  };

  if (!matrix.length) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-5xl font-black text-white tracking-tighter">Role Matrix Control</h2>
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] mt-3">Global Tier Configuration Node</p>
        </div>
        <div className="px-6 py-3 glass rounded-2xl border-white/5 flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Sync: ONLINE</span>
        </div>
      </header>

      {toast && (
        <div className="fixed top-10 right-10 bg-blue-600 text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl z-[500] animate-in slide-in-from-right-10">
           🛡️ {toast}
        </div>
      )}

      <div className="glass rounded-[48px] border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="p-10 border-b border-r border-white/5 font-black text-slate-500 uppercase tracking-widest text-[11px] w-64 bg-navy-950/50 sticky left-0 z-20">Role Hierarchy ↓</th>
                {COLUMNS.map(col => (
                  <th key={col.id} className="p-8 border-b border-white/5 font-black text-slate-500 uppercase tracking-widest text-[10px] text-center min-w-[150px]">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ROLES.map(role => {
                const roleEntry = matrix.find(m => m.role === role);
                return (
                  <tr key={role} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="p-10 border-r border-white/5 font-black text-white tracking-tight text-xl bg-navy-950/50 sticky left-0 z-10 group-hover:text-blue-400 transition-colors">
                      {role.replace('_', ' ')}
                    </td>
                    {COLUMNS.map(col => {
                      const isEnabled = roleEntry?.permissions[col.id];
                      const lockKey = `${role}-${col.id}`;
                      const isSaving = saving === lockKey;

                      return (
                        <td key={col.id} className="p-6 text-center">
                          <div className="flex justify-center items-center">
                            <button
                              disabled={isSaving}
                              onClick={() => handleToggle(role, col.id, !!isEnabled)}
                              className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-300 ${
                                isEnabled 
                                  ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/30 text-white' 
                                  : 'bg-white/5 border-white/5 hover:border-white/20 text-slate-600'
                              } ${isSaving ? 'animate-pulse scale-90' : 'hover:scale-110 active:scale-95'}`}
                            >
                              {isSaving ? (
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              ) : isEnabled ? (
                                <span className="text-sm font-black">✓</span>
                              ) : (
                                <span className="text-[10px] opacity-40">○</span>
                              )}
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-10 glass rounded-[40px] border-white/5 text-slate-500 font-medium text-xs italic flex items-start space-x-6">
        <span className="text-amber-500 font-black not-italic shrink-0 uppercase tracking-widest text-[10px]">Security Note:</span>
        <p>This matrix controls base privileges for the entire user tier. Changes affect all associated identities across the Fin-Vault node immediately. SUPER_ADMIN capabilities are locked for system stability.</p>
      </div>
    </div>
  );
};

export default PermissionTable;
