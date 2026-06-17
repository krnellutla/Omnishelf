import React, { useState } from 'react';
import { Shield, Users, RefreshCw, CheckCircle, Info, Lock, Key, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { UserRole } from '../types';

interface DirectorySSOHubProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  approvalLimit: number;
  onChangeApprovalLimit: (limit: number) => void;
  isSsoEnforced: boolean;
  onToggleSso: () => void;
}

export default function DirectorySSOHub({
  currentRole,
  onChangeRole,
  approvalLimit,
  onChangeApprovalLimit,
  isSsoEnforced,
  onToggleSso
}: DirectorySSOHubProps) {
  const [activeTab, setActiveTab] = useState<'sso' | 'roles' | 'policies'>('sso');
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS'>('IDLE');
  const [syncRecords, setSyncRecords] = useState<any[]>([
    { id: '1', name: 'James Carter', email: 'j.carter@logiledger.internal', status: 'Synced', role: 'Operations Director', provider: 'Okta SSO' },
    { id: '2', name: 'Sarah Connor', email: 's.connor@logiledger.internal', status: 'Synced', role: 'Warehouse Manager', provider: 'Okta SSO' },
    { id: '3', name: 'Marcus Sterling', email: 'm.sterling@logiledger.internal', status: 'Synced', role: 'Finance Controller', provider: 'Okta SSO' },
    { id: '4', name: 'Emily Thorne', email: 'e.thorne@logiledger.internal', status: 'Synced', role: 'Fulfillment Coordinator', provider: 'Okta SSO' }
  ]);

  const handleSyncDirectory = () => {
    setSyncStatus('SYNCING');
    setTimeout(() => {
      setSyncStatus('SUCCESS');
      const updated = [...syncRecords];
      updated.push({
        id: `usr-${Math.random().toString(36).substr(2, 5)}`,
        name: 'Alex Vance',
        email: 'a.vance@logiledger.internal',
        status: 'Synced',
        role: 'Warehouse Manager',
        provider: 'Okta Directory Sync'
      });
      setSyncRecords(updated);
      setTimeout(() => setSyncStatus('IDLE'), 2000);
    }, 1500);
  };

  const rolePermissions: Record<UserRole, { title: string; desc: string; grants: string[]; denies: string[] }> = {
    'Operations Director': {
      title: 'Operations Director (Full Domain Admin)',
      desc: 'Complete read-write-delete access over all tenant locations, inventory books, custom fields, and physical approvals.',
      grants: ['Edit Product Pricing & Costs', 'Authorize Heavy Reorders', 'Override Safety Thresholds', 'Flush Log Ledgers', 'Configure SSO Protocols'],
      denies: []
    },
    'Warehouse Manager': {
      title: 'Warehouse Manager (Operations & Counting Control)',
      desc: 'Controls floor stock, cycle counts, receive PO logs, barcode scanning, and bin allocations.',
      grants: ['Enter Physical Counts & lot tracking', 'Run ABC Cycle Audits', 'Scan Out Feedstocks', 'Mark POs Received'],
      denies: ['View Global Retail Finance Margins', 'Alter Base Selling Price', 'Approve Purchases above Thresholds']
    },
    'Finance Controller': {
      title: 'Finance Controller (Costing & Margin Auditor)',
      desc: 'Reviews pricing matrices, handles landed costs spread allocations, oversees three-way matches and COGS ledgers.',
      grants: ['Edit Cost Prices & Costing Methods', 'Perform 3-Way Match Validation', 'Access Aging & Shrinkage Costs Reports'],
      denies: ['Perform Physical Pack/Ship scanning', 'Alter bin location maps']
    },
    'Fulfillment Coordinator': {
      title: 'Fulfillment Coordinator (Shipping & Logistics Handler)',
      desc: 'Responsible for pick sheets, packing parcels, comparative shipping carrier rate evaluation, and tracking.',
      grants: ['Generate Pick Lists', 'Shop Multi-Carrier Courier Rates', 'Release Tracking Signals', 'Handle RMAs & Returns'],
      denies: ['Edit Base Purchasing Costs', 'Adjust Safety Stock thresholds', 'Revoke Tenant integrations']
    }
  };

  return (
    <div id="directory-sso-container" className="bg-white border border-gray-205 border-gray-200 rounded-2xl p-6 space-y-6 font-sans shadow-xs">
      {/* Header and Pill switches */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-150 pb-5">
        <div>
          <h3 className="font-bold text-gray-950 text-base flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-650 text-indigo-600" /> Identity Access & SSO Engine
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Enterprise-grade User Provisioning, Directory Syncing (SCIM), and Role-Based Access controls.
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('sso')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'sso' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Directory Sync & SSO
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'roles' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            RBAC Core Roles
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'policies' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Approval Policies
          </button>
        </div>
      </div>

      {/* SSE / Sync Directory Tab content */}
      {activeTab === 'sso' && (
        <div id="sso-panel" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Identity Status Card */}
            <div className="bg-slate-50 border border-slate-205 border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Security Gateway</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200">Active SecLink</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Okta Directory Sync</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Automatically provisions workspace users, assigns security groups, and enforces Multi-Factor Authentication protocols on checkout.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <button
                  onClick={handleSyncDirectory}
                  disabled={syncStatus === 'SYNCING'}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:bg-indigo-400 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'SYNCING' ? 'animate-spin' : ''}`} />
                  {syncStatus === 'SYNCING' ? 'Polling SCIM Endpoint...' : syncStatus === 'SUCCESS' ? 'Directory Synchronized!' : 'Poll Directory Sync'}
                </button>
              </div>
            </div>

            {/* SSO Enforce Controller */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Authentication</span>
                <h4 className="font-bold text-slate-800 text-sm">Force SSO Compliance</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  When enabled, passwords are disabled. Authorized staff must authenticate solely via your enterprise identity provider (Okta, Entra, or Google Workspace).
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-450 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">{isSsoEnforced ? 'SSO Enforced Strict' : 'SSO Optional'}</span>
                </div>
                <button onClick={onToggleSso} className="text-slate-700 hover:text-slate-900 focus:outline-none cursor-pointer">
                  {isSsoEnforced ? (
                    <ToggleRight className="w-9 h-9 text-indigo-650 text-indigo-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Secure Session Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Security Posture</span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">SAML 2.0 State</span>
                  <span className="font-semibold text-emerald-650 text-emerald-600">Secure Linked</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">MFA Policy</span>
                  <span className="text-slate-700 font-semibold text-right">Adaptive Biometric</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Encryption Method</span>
                  <span className="text-slate-700 font-mono text-[10px] font-semibold">AES-256 GCM</span>
                </div>
              </div>
              <div className="p-2.5 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg text-[9px] flex gap-2">
                <Info className="w-4 h-4 shrink-0 text-yellow-600" />
                <span>Switching roles in the RBAC panel instantly updates system interface visibility and locks down write features.</span>
              </div>
            </div>
          </div>

          {/* Directory User Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
              <Users className="w-4 h-4 text-indigo-500" /> Active Organization User Directory ({syncRecords.length} synchronized)
            </h4>
            <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                    <th className="px-4 py-2.5">Full Name</th>
                    <th className="px-4 py-2.5">Email Destination</th>
                    <th className="px-4 py-2.5">Enterprise Role</th>
                    <th className="px-4 py-2.5">ID Provider</th>
                    <th className="px-4 py-2.5 text-center">Federation State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {syncRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center font-bold text-[9px]">
                          {r.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        {r.name}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{r.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          r.role === 'Operations Director' ? 'bg-purple-50 text-purple-700 border border-purple-150' :
                          r.role === 'Warehouse Manager' ? 'bg-sky-50 text-sky-700 border border-sky-150' :
                          r.role === 'Finance Controller' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                          'bg-indigo-50 text-indigo-700 border border-indigo-150'
                        }`}>
                          {r.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{r.provider}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle className="w-3.5 h-3.5" /> Synchronized
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RBAC Core Roles Tab Content */}
      {activeTab === 'roles' && (
        <div id="rbac-panel" className="space-y-6">
          <div className="p-4 bg-indigo-900 text-indigo-100 rounded-2xl flex flex-col md:flex-row items-center gap-4 border border-indigo-950 justify-between">
            <div className="space-y-1 text-center md:text-left">
              <h4 className="font-bold text-sm text-white flex items-center gap-2 justify-center md:justify-start">
                <Shield className="w-4 h-4 text-indigo-300" /> Simulate Real-time Security Role Transitions
              </h4>
              <p className="text-xs text-indigo-200">
                Change your active identity signature here to experience realistic organizational lockdowns across pricing, orders, and audits.
              </p>
            </div>
            {/* Active Switcher */}
            <div className="flex flex-wrap gap-2 shrink-0">
              {(Object.keys(rolePermissions) as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => onChangeRole(role)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    currentRole === role
                      ? 'bg-white text-indigo-950 shadow-md ring-2 ring-indigo-500 ring-offset-2 ring-offset-indigo-900'
                      : 'bg-indigo-950/40 text-indigo-200 hover:bg-indigo-950/60'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {(Object.keys(rolePermissions) as UserRole[]).map((role) => {
              const details = rolePermissions[role];
              const isActive = currentRole === role;
              return (
                <div
                  key={role}
                  className={`border rounded-2xl p-4 flex flex-col justify-between space-y-4 transition ${
                    isActive ? 'bg-gradient-to-b from-indigo-50/40 to-white border-indigo-300 shadow-md ring-1 ring-indigo-300' : 'bg-white border-gray-200 hover:border-gray-250'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        role === 'Operations Director' ? 'bg-purple-100 text-purple-800' :
                        role === 'Warehouse Manager' ? 'bg-sky-100 text-sky-800' :
                        role === 'Finance Controller' ? 'bg-amber-100 text-amber-800' :
                        'bg-indigo-100 text-indigo-800'
                      }`}>
                        {role.split(' ')[0]}
                      </span>
                      {isActive && (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-650">
                          <CheckCircle className="w-3 h-3" /> Active Session
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs tracking-tight">{details.title}</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed mt-1">{details.desc}</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-3 border-t border-gray-100">
                    {/* Grants */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block">Grants / Allowed Actions</span>
                      {details.grants.map((g, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[10px] text-gray-700">
                          <span className="text-emerald-500 font-extrabold mt-0.5">✓</span>
                          <span>{g}</span>
                        </div>
                      ))}
                    </div>

                    {/* Denies */}
                    {details.denies.length > 0 && (
                      <div className="space-y-1.5 border-t border-gray-100 pt-2.5">
                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest block">Permissions Lockdowns</span>
                        {details.denies.map((d, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[10px] text-gray-500">
                            <Lock className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                            <span className="line-through">{d}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Approval Policies Tab Content */}
      {activeTab === 'policies' && (
        <div id="policies-panel" className="space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-650" /> Dual-Control Procurement Threshold Policy
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                For security and regulatory compliance, any purchase order or stock adjustment above threshold configurations is automatically held as "Draft (Pending Approval)" instead of writing instantly. Only an user validated as an **Operations Director** can release these holds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Single Adjustment Approval Threshold (USD Value)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={approvalLimit}
                    onChange={(e) => onChangeApprovalLimit(Number(e.target.value))}
                    className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="px-3 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 font-mono">
                    ${approvalLimit}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Any reorder order valuing more than ${approvalLimit} will lock as 'Pending Signoff'.
                </p>
              </div>

              <div id="active-approvals-matrix" className="space-y-2">
                <span className="block text-xs font-bold text-slate-700">Approval Requirements Summary</span>
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-[11px] space-y-11.5 space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Restock Orders below ${approvalLimit}</span>
                    <span className="text-emerald-700 font-bold">Auto-approved</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1.5">
                    <span className="text-slate-500">Restock Orders above ${approvalLimit}</span>
                    <span className="text-amber-700 font-bold">Requires Admin Release</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="alert-warning-box" className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-indigo-650 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs leading-relaxed">
              <span className="font-bold">Compliant Ledger Mandate</span>
              <p className="text-indigo-800">
                All physical stock counts, three-way cost receipts, and packing logs are locked to the synchronized operator signature. Discrepancies triggering variance exceptions will require mandatory justification reasons mapped directly in the logs to pass SOC 2 / financial reconciliation standards.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
