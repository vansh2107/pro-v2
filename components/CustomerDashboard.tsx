
import React, { useState, useMemo } from 'react';
import { User, Asset, AssetType } from '../types';
import { getAssets, addAsset, deleteAsset, getDocuments, addAuditLog, getFamilyMembers } from '../db';
import AuthService from '../authService';
import AssetForm from './AssetForm';
import DocumentVault from './DocumentVault';
import FamilyMemberManager from './FamilyMemberManager';

interface CustomerDashboardProps {
  customer: User;
  actingUser: User;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ customer, actingUser }) => {
  const [refresh, setRefresh] = useState(0);
  const familyId = customer.id;
  
  const members = useMemo(() => getFamilyMembers(familyId), [familyId, refresh]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | 'ALL'>('ALL');
  const [activeCategory, setActiveCategory] = useState<AssetType | null>(null);
  const [showMemberManager, setShowMemberManager] = useState(false);

  const allAssets = getAssets();
  const allDocs = getDocuments();

  const familyAssets = allAssets.filter(a => a.familyId === familyId);
  const currentAssets = selectedMemberId === 'ALL' 
    ? familyAssets 
    : familyAssets.filter(a => a.memberId === selectedMemberId);

  const categoryData = Object.values(AssetType).map(type => {
    const assetsForType = currentAssets.filter(a => a.type === type);
    const docsForType = allDocs.filter(d => d.familyId === familyId && d.category === type);
    const totalValue = assetsForType.reduce((sum, a) => sum + a.value, 0);
    return { type, totalValue, count: assetsForType.length, docCount: docsForType.length };
  });

  const totalWorth = categoryData.reduce((sum, c) => sum + c.totalValue, 0);

  // Use the new centralized role-based Matrix Permission system
  const canEdit = AuthService.hasPermission(actingUser, 'EDIT_CUSTOMERS');
  const canDelete = AuthService.hasPermission(actingUser, 'DELETE_CASCADE');
  const canSeeWholeFamily = AuthService.hasPermission(actingUser, 'WHOLE_FAMILY');

  const handleAddAsset = (newAsset: Omit<Asset, 'id' | 'lastUpdated'>) => {
    if (!canEdit) {
      alert("Unauthorized: Node capability restricted for your tier.");
      return;
    }
    const asset: Asset = { 
      ...newAsset, 
      id: Math.random().toString(36).substr(2, 9), 
      lastUpdated: new Date().toISOString().split('T')[0] 
    };
    addAsset(asset);
    addAuditLog({ 
      actorId: actingUser.id, 
      actingAsId: actingUser.id !== customer.id ? customer.id : undefined, 
      action: 'ASSET_CREATE', 
      details: `Added ${asset.type} worth $${asset.value} for node ${customer.name}`, 
      timestamp: new Date().toISOString(), 
      severity: 'INFO' 
    });
    setRefresh(r => r + 1);
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <header className="glass rounded-[40px] p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
        <div className="relative z-10">
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2">{customer.name}</h1>
          <p className="text-slate-400 font-medium flex items-center space-x-2 uppercase tracking-widest text-[10px]">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
            <span>Cluster Identity Core</span>
          </p>
        </div>
        <div className="flex items-center space-x-12 relative z-10">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Net Node Value</p>
            <p className="text-5xl font-black text-white tracking-tight">${totalWorth.toLocaleString()}</p>
          </div>
          {canSeeWholeFamily && (
            <button 
                onClick={() => setShowMemberManager(true)}
                className="flex flex-col items-center group/btn"
            >
                <div className="flex -space-x-3 mb-3">
                {members.slice(0, 3).map(m => (
                    <div key={m.id} className="w-12 h-12 rounded-2xl bg-white/5 border-2 border-[#070A14] flex items-center justify-center text-xs font-black text-slate-300 group-hover/btn:border-blue-500 transition-all shadow-xl">
                    {m.name[0]}
                    </div>
                ))}
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover/btn:text-blue-400 transition-colors">Unit Console</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex space-x-3 overflow-x-auto pb-4 custom-scrollbar scrollbar-hide px-2">
        <button
          onClick={() => setSelectedMemberId('ALL')}
          className={`px-8 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
            selectedMemberId === 'ALL' 
              ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/20 border-blue-500' 
              : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
          }`}
        >
          Aggregated Protocol
        </button>
        {canSeeWholeFamily && members.map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedMemberId(m.id)}
            className={`px-8 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              selectedMemberId === m.id 
                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-600/20 border-indigo-500' 
                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
        {categoryData.map(category => (
          <div 
            key={category.type} 
            onClick={() => setActiveCategory(category.type)}
            className="glass rounded-[32px] p-8 border-white/5 hover:border-blue-500/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:-translate-y-2 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[40px] group-hover:bg-blue-500/10 transition-all"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 bg-white/5 rounded-[20px] flex items-center justify-center text-3xl group-hover:bg-blue-500/20 group-hover:scale-110 transition-all shadow-inner">
                  {getCategoryIcon(category.type)}
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{category.count} items</p>
                   <div className="flex justify-end space-x-1">
                     <span className={`w-1 h-1 rounded-full ${category.docCount > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></span>
                     <span className={`w-1 h-1 rounded-full ${category.count > 0 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-700'}`}></span>
                   </div>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{category.type}</p>
              <h4 className="text-3xl font-black text-white tracking-tight">${category.totalValue.toLocaleString()}</h4>
              
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{category.docCount} Data Proofs</span>
                 <span className="text-blue-400 font-black text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">Details →</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showMemberManager && (
        <FamilyMemberManager 
          familyId={familyId} 
          onClose={() => setShowMemberManager(false)} 
          onUpdate={() => setRefresh(r => r + 1)}
        />
      )}

      {activeCategory && (
        <div className="fixed inset-0 bg-[#070A14]/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="glass rounded-[48px] border-white/10 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-blue-950/20">
            <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div>
                <h3 className="text-4xl font-black text-white tracking-tighter">{activeCategory} Protocol</h3>
                <p className="text-slate-400 font-medium uppercase tracking-widest text-[10px] mt-2">Managing node: <span className="text-white">{selectedMemberId === 'ALL' ? 'Collective Identity' : members.find(m => m.id === selectedMemberId)?.name}</span></p>
              </div>
              <button onClick={() => setActiveCategory(null)} className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl transition-all flex items-center justify-center text-2xl text-slate-400 hover:text-white">✕</button>
            </div>
            
            <div className="flex-1 overflow-auto p-10 space-y-12 custom-scrollbar">
               {canEdit && (
                 <div className="glass p-8 rounded-[32px] border-white/5">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-8">Data Ingestion Node</h4>
                    <AssetForm 
                      familyId={familyId}
                      members={members}
                      preSelectedMemberId={selectedMemberId === 'ALL' ? undefined : selectedMemberId}
                      fixedType={activeCategory} 
                      onSave={handleAddAsset} 
                      onCancel={() => setActiveCategory(null)} 
                    />
                 </div>
               )}
               
               <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <h4 className="text-2xl font-black text-white tracking-tight">Node Holdings</h4>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full">{currentAssets.filter(a => a.type === activeCategory).length} Active Segments</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentAssets.filter(a => a.type === activeCategory).map(asset => (
                      <div key={asset.id} className="glass p-6 rounded-[24px] border-white/5 hover:border-white/10 transition-all group/card">
                        <div className="flex justify-between items-start mb-6">
                           <div>
                             <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 px-2 py-0.5 bg-blue-500/10 rounded-full w-fit">
                                {members.find(m => m.id === asset.memberId)?.name || 'Unknown'}
                             </p>
                             <span className="text-3xl font-black text-white tracking-tight">${asset.value.toLocaleString()}</span>
                           </div>
                           {canDelete && (
                             <button onClick={() => { deleteAsset(asset.id); setRefresh(r => r + refresh + 1); }} className="text-slate-600 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition-all opacity-0 group-hover/card:opacity-100">🗑️</button>
                           )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                           {Object.entries(asset.details).map(([k, v]) => (
                             <div key={k}>
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{k}</p>
                               <p className="text-xs font-bold text-slate-300 truncate">{String(v)}</p>
                             </div>
                           ))}
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="border-t border-white/5 pt-12">
                  <DocumentVault 
                    familyId={familyId}
                    members={members}
                    selectedMemberId={selectedMemberId}
                    actingUser={actingUser} 
                    fixedCategory={activeCategory} 
                  />
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getCategoryIcon(type: AssetType) {
  switch (type) {
    case AssetType.STOCKS: return '📈';
    case AssetType.BONDS: return '🏛️';
    case AssetType.MUTUAL_FUNDS: return '🗳️';
    case AssetType.FIXED_DEPOSITS: return '🔒';
    case AssetType.PPF: return '🏦';
    case AssetType.LIFE_INSURANCE: return '🛡️';
    case AssetType.TERM_INSURANCE: return '🗓️';
    default: return '💰';
  }
}

export default CustomerDashboard;
