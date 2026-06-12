import React, { useState } from 'react';
import { ClipboardCheck, Sparkles, AlertCircle, BarChart3, CheckCircle2, Save, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { Product, CycleCountSession, CycleCountItem, UserRole } from '../types';

interface CycleCountHubProps {
  products: Product[];
  currentRole: UserRole;
  onAdjustProductStock: (productId: string, newQty: number, reason: string) => void;
  onUpdateProductTrackingDetails: (productId: string, trackingType: 'NONE' | 'LOT' | 'SERIAL' | 'EXPIRY', lot?: string, serial?: string, expiry?: string) => void;
  countSessions: CycleCountSession[];
  onSaveCountSession: (session: CycleCountSession) => void;
}

export default function CycleCountHub({
  products,
  currentRole,
  onAdjustProductStock,
  onUpdateProductTrackingDetails,
  countSessions,
  onSaveCountSession
}: CycleCountHubProps) {
  const [activeTab, setActiveTab] = useState<'abc' | 'sessions'>('abc');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Active session counts
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});
  const [reasonCodes, setReasonCodes] = useState<Record<string, string>>({});
  
  // Lot / serial edits states
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [trackingType, setTrackingType] = useState<'NONE' | 'LOT' | 'SERIAL' | 'EXPIRY'>('NONE');
  const [lotNum, setLotNum] = useState('');
  const [serialNum, setSerialNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // 1. ABC classification helper
  // A products = cost > $100 or total value pool > $1000
  // B products = cost $20 - $100
  // C products = cost < $20
  const getAbcClass = (p: Product) => {
    const valueMultiplier = p.cost * p.quantity;
    if (p.cost >= 45 || valueMultiplier >= 1000) return 'A';
    if (p.cost >= 15) return 'B';
    return 'C';
  };

  const handleStartCountSession = (abcClass: 'A' | 'B' | 'C' | 'ALL') => {
    const targetProducts = products.filter(p => abcClass === 'ALL' || getAbcClass(p) === abcClass);
    if (targetProducts.length === 0) return;

    const countItems: CycleCountItem[] = targetProducts.map(p => ({
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      expectedQuantity: p.quantity,
      actualQuantity: p.quantity, // preset to expected to avoid total resets
      variance: 0,
      reasonCode: 'Match'
    }));

    const newSession: CycleCountSession = {
      id: `CNT-${Math.floor(100000 + Math.random() * 900000)}`,
      tenantId: products[0]?.tenantId || 'tenant-apex',
      name: `Class [${abcClass}] Safety Cycle Audit`,
      status: 'ACTIVE',
      items: countItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      operatorUserId: 'warehouse-staff'
    };

    onSaveCountSession(newSession);
    setActiveSessionId(newSession.id);

    // Seed state for this session
    const counts: Record<string, number> = {};
    const reasons: Record<string, string> = {};
    countItems.forEach(item => {
      counts[item.productId] = item.expectedQuantity;
      reasons[item.productId] = 'Match';
    });
    setPhysicalCounts(counts);
    setReasonCodes(reasons);
  };

  const handleApplyTrackingSave = (productId: string) => {
    onUpdateProductTrackingDetails(productId, trackingType, lotNum, serialNum, expiryDate);
    setEditingProdId(null);
  };

  const handleReconcileCycleCount = (session: CycleCountSession) => {
    // Reconcile and save stock adjustments
    const finalItems = session.items.map(item => {
      const actQty = physicalCounts[item.productId] ?? item.expectedQuantity;
      const variance = actQty - item.expectedQuantity;
      const rc = reasonCodes[item.productId] || 'Physical count verification';
      return {
        ...item,
        actualQuantity: actQty,
        variance,
        reasonCode: rc
      };
    });

    const hasVariance = finalItems.some(it => it.variance !== 0);

    // If there is variance and current user is not operations director, flag it for approval!
    let finalStatus: 'RECONCILED' | 'PENDING_APPROVAL' = 'RECONCILED';
    if (hasVariance && currentRole !== 'Operations Director') {
      finalStatus = 'PENDING_APPROVAL';
    }

    const updatedSession: CycleCountSession = {
      ...session,
      status: finalStatus,
      items: finalItems,
      updatedAt: new Date().toISOString(),
      approvedBy: finalStatus === 'RECONCILED' ? currentRole : undefined
    };

    onSaveCountSession(updatedSession);

    if (finalStatus === 'RECONCILED') {
      // Actually apply those stock changes to the database!
      finalItems.forEach(item => {
        if (item.variance !== 0) {
          const sign = item.variance! > 0 ? '+' : '';
          const recName = reasonCodes[item.productId] || 'Count Reconciliation';
          onAdjustProductStock(
            item.productId, 
            item.actualQuantity!, 
            `Cycle Count reconciled (${session.id}). Variance: ${sign}${item.variance}. Reason code: ${recName}`
          );
        }
      });
      alert(`Cycle Count Reconciled! Stock quantities successfully updated in the master ledger.`);
    } else {
      alert(`Count session submitted for administrative sign-off! Reason: Stock physical variances require Operations lock approval.`);
    }

    setActiveSessionId(null);
  };

  const handleApproveVarianceSession = (session: CycleCountSession) => {
    if (currentRole !== 'Operations Director') {
      alert("Permission Lockdown: Only Operations Directors can authorize count variance adjustments.");
      return;
    }

    const updatedSession: CycleCountSession = {
      ...session,
      status: 'RECONCILED' as const,
      approvedBy: 'Operations Director',
      updatedAt: new Date().toISOString()
    };

    onSaveCountSession(updatedSession);

    // Apply adjustments
    session.items.forEach(item => {
      const actualQty = item.actualQuantity ?? item.expectedQuantity;
      const variance = actualQty - item.expectedQuantity;
      if (variance !== 0) {
        const sign = variance > 0 ? '+' : '';
        onAdjustProductStock(
          item.productId, 
          actualQty, 
          `Cycle Count approved by Ops Director (${session.id}). Variance: ${sign}${variance}. Reason: ${item.reasonCode}`
        );
      }
    });

    alert("Count variance successfully authorized and synced to the core ledger.");
    setActiveSessionId(null);
  };

  const activeSession = countSessions.find(s => s.id === activeSessionId);

  return (
    <div id="cycle-count-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* Left side scheduling & tables list */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-5">
          <div>
            <h3 className="font-bold text-gray-950 text-base flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-indigo-650 text-indigo-600" /> Cycle Audit Hub & Lot Register
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              ABC-rate security classes, physical inventory counting, lot, and serial register managers.
            </p>
          </div>
          
          <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5 text-xs font-bold shrink-0 self-start">
            <button
              onClick={() => setActiveTab('abc')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'abc' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              ABC Classes & Lot Tracking
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'sessions' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Audit History ({countSessions.length})
            </button>
          </div>
        </div>

        {activeTab === 'abc' && (
          <div className="space-y-6">
            {/* ABC Classification Scheduler panel */}
            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-4">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">ABC Counting Scheduler Policy</span>
              <p className="text-xs text-slate-500 leading-relaxed">
                We categorize active SKUs recursively based on item unit cost. Recommended frequencies keep carries accurate without causing daily bottlenecks.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {/* Class A */}
                <div className="bg-white border border-purple-200 rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-lg text-[10px] font-extrabold uppercase font-mono">Class A</span>
                      <span className="text-[9px] text-purple-600 font-bold block">15-Day Cycle</span>
                    </div>
                    <span className="font-bold text-xs text-slate-700 block">Critical Cost Assets</span>
                    <span className="text-[10px] text-slate-450 text-slate-400 block font-mono">Unit cost ≥ $45.00</span>
                  </div>
                  <button
                    onClick={() => handleStartCountSession('A')}
                    className="w-full text-center py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-[10px] font-extrabold cursor-pointer transition"
                  >
                    Count Class A ({products.filter(p => getAbcClass(p) === 'A').length} SKUs)
                  </button>
                </div>

                {/* Class B */}
                <div className="bg-white border border-sky-200 rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-lg text-[10px] font-extrabold uppercase font-mono">Class B</span>
                      <span className="text-[9px] text-sky-600 font-bold block">45-Day Cycle</span>
                    </div>
                    <span className="font-bold text-xs text-slate-700 block">Standard Margin Assets</span>
                    <span className="text-[10px] text-slate-450 text-slate-400 block font-mono">Unit cost $15 - $45</span>
                  </div>
                  <button
                    onClick={() => handleStartCountSession('B')}
                    className="w-full text-center py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-[10px] font-extrabold cursor-pointer transition"
                  >
                    Count Class B ({products.filter(p => getAbcClass(p) === 'B').length} SKUs)
                  </button>
                </div>

                {/* Class C */}
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 bg-gray-100 text-slate-700 rounded-lg text-[10px] font-extrabold uppercase font-mono">Class C</span>
                      <span className="text-[9px] text-slate-500 font-bold block">Annual Cycle</span>
                    </div>
                    <span className="font-bold text-xs text-slate-700 block">Fast Velocity Items</span>
                    <span className="text-[10px] text-slate-405 text-slate-400 block font-mono">Unit cost &lt; $15.00</span>
                  </div>
                  <button
                    onClick={() => handleStartCountSession('C')}
                    className="w-full text-center py-1.5 bg-gray-50 hover:bg-gray-100 text-slate-800 border border-gray-200 rounded-xl text-[10px] font-extrabold cursor-pointer transition"
                  >
                    Count Class C ({products.filter(p => getAbcClass(p) === 'C').length} SKUs)
                  </button>
                </div>
              </div>
            </div>

            {/* Catalog Master Lot details panel */}
            <div className="space-y-3">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Product Expiry, Lot, and Serial Profiles</span>
              <div className="border border-gray-150 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-205 text-slate-500 font-bold text-[9px] uppercase tracking-wider">
                      <th className="px-4 py-2">Product & SKU</th>
                      <th className="px-4 py-2">ABC Class</th>
                      <th className="px-4 py-2">Tracking Mandate</th>
                      <th className="px-4 py-2">Lot / Expiry Details</th>
                      <th className="px-4 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 text-[11px]">
                    {products.map(p => {
                      const c = getAbcClass(p);
                      const isEditing = editingProdId === p.id;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5">
                            <span className="font-bold text-slate-800 block text-[12px]">{p.name}</span>
                            <span className="text-slate-400 font-mono text-[9px]">{p.sku}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono ${
                              c === 'A' ? 'bg-purple-100 text-purple-800' :
                              c === 'B' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-700'
                            }`}>{c}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            {isEditing ? (
                              <select
                                value={trackingType}
                                onChange={(e: any) => setTrackingType(e.target.value)}
                                className="p-1 border border-gray-300 rounded-lg font-bold"
                              >
                                <option value="NONE">Standard Qty</option>
                                <option value="LOT">Lot Tracking</option>
                                <option value="SERIAL">Serialised</option>
                                <option value="EXPIRY">Expiry-Critical</option>
                              </select>
                            ) : (
                              <span className="font-semibold text-slate-700">{p.trackingType || 'NONE'}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-600">
                            {isEditing ? (
                              <div className="space-y-1 flex flex-col">
                                {trackingType === 'LOT' && (
                                  <input
                                    placeholder="Lot #"
                                    value={lotNum}
                                    onChange={(e) => setLotNum(e.target.value)}
                                    className="p-1 border rounded-lg"
                                  />
                                )}
                                {trackingType === 'SERIAL' && (
                                  <input
                                    placeholder="Serial Key"
                                    value={serialNum}
                                    onChange={(e) => setSerialNumber(e.target.value)}
                                    className="p-1 border rounded-lg"
                                  />
                                )}
                                {trackingType === 'EXPIRY' && (
                                  <input
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className="p-1 border rounded-lg"
                                  />
                                )}
                              </div>
                            ) : (
                              <div>
                                {p.trackingType === 'LOT' && <span>Lot: {p.lotNumber || 'LT-9801'}</span>}
                                {p.trackingType === 'SERIAL' && <span>Serial: {p.serialNumber || 'SR-EA39'}</span>}
                                {p.trackingType === 'EXPIRY' && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {p.expiryDate || '2026-12-31'}</span>}
                                {(!p.trackingType || p.trackingType === 'NONE') && <span className="text-slate-400">—</span>}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {isEditing ? (
                              <button
                                onClick={() => handleApplyTrackingSave(p.id)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-bold cursor-pointer transition flex items-center gap-1 mx-auto"
                              >
                                <Save className="w-3 h-3" /> Save
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingProdId(p.id);
                                  setTrackingType(p.trackingType || 'NONE');
                                  setLotNum(p.lotNumber || '');
                                  setSerialNumber(p.serialNumber || '');
                                  setExpiryDate(p.expiryDate || '');
                                }}
                                className="px-2 py-1 border border-gray-250 text-indigo-650 hover:bg-slate-100 rounded-lg text-[9px] font-bold cursor-pointer transition"
                              >
                                Configure
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {countSessions.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl space-y-3">
                <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="text-gray-900 font-bold text-sm">No Count Logs On File</p>
                  <p className="text-xs text-slate-500">Initiate an ABC Class schedule Audit above to sync new counting histories.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {countSessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => { setActiveSessionId(session.id); }}
                    className={`p-4 border rounded-2xl cursor-pointer hover:border-gray-250 transition ${
                      activeSessionId === session.id ? 'bg-indigo-50/20 border-indigo-400' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-850">{session.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            session.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                            session.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-emerald-150 text-emerald-800 bg-emerald-100'
                          }`}>{session.status}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-xs">{session.name}</h4>
                        <p className="text-[10px] text-slate-400">Locked to: {session.operatorUserId} • Synced: {new Date(session.createdAt).toLocaleDateString()}</p>
                      </div>

                      <div className="text-right text-xs">
                        <span className="text-[9px] text-slate-400 block font-bold">Variances Audit</span>
                        <span className={`font-mono font-bold ${
                          session.items.some(it => it.variance !== 0) ? 'text-red-650 text-red-600' : 'text-emerald-650 text-emerald-600'
                        }`}>
                          {session.items.some(it => it.variance !== 0) ? 'Discrepancy Log' : 'Zero Deviation'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side inspector terminal panel */}
      <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 space-y-6">
        {activeSession ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 font-mono">Mobile Register</span>
                <h4 className="font-bold text-slate-900 text-[14px] font-mono">{activeSession.id}</h4>
              </div>
              <button
                onClick={() => setActiveSessionId(null)}
                className="text-xs uppercase font-extrabold text-slate-400 hover:text-slate-800 transition cursor-pointer"
              >
                Close Audit
              </button>
            </div>

            {/* Session status badge checks */}
            {activeSession.status === 'PENDING_APPROVAL' && (
              <div className="p-3.5 bg-yellow-50 text-yellow-800 border border-yellow-250 border-yellow-250 border rounded-2xl text-xs space-y-2">
                <span className="font-extrabold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-yellow-650" /> Administrative Variance Approval Required
                </span>
                <p className="text-yellow-700 text-[11px] leading-relaxed">
                  Physical counts reported variance against the ledger. Permission rules dictate an user with an active <strong>Operations Director</strong> role must audit and authorize this write-off.
                </p>
                {currentRole === 'Operations Director' ? (
                  <button
                    onClick={() => handleApproveVarianceSession(activeSession)}
                    className="w-full text-center py-1.5 bg-indigo-650 hover:bg-slate-900 text-white rounded-xl text-[10px] font-extrabold cursor-pointer transition"
                  >
                    Authorise & Sync Count Adjustments
                  </button>
                ) : (
                  <span className="block text-[10px] font-bold text-red-650">Switch role context to Operations Director to authorize.</span>
                )}
              </div>
            )}

            {/* Active Inventory counting terminal items list */}
            {activeSession.status === 'ACTIVE' && (
              <div className="space-y-5">
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-xl text-[11px] flex gap-2">
                  <AlertCircle className="w-4 h-4 text-indigo-650 shrink-0 mt-0.5" />
                  <span>Count physical items on shelves carefully. Discrepancies generate warning holds.</span>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Physical Stock Count Register</span>
                  <div className="bg-white border border-gray-250 rounded-xl divide-y divide-gray-100 font-sans max-h-[20rem] overflow-y-auto">
                    {activeSession.items.map(item => {
                      const computedVal = physicalCounts[item.productId] ?? item.expectedQuantity;
                      const devVal = computedVal - item.expectedQuantity;

                      return (
                        <div key={item.productId} className="p-3 space-y-3.5 flex flex-col bg-white">
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <div>
                              <span className="font-bold text-slate-800 text-[11px] block">{item.productName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">System expected: {item.expectedQuantity}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Actual:</label>
                              <input
                                type="number"
                                min="0"
                                value={computedVal}
                                onChange={(e) => setPhysicalCounts({
                                  ...physicalCounts,
                                  [item.productId]: Number(e.target.value)
                                })}
                                className="w-16 py-1 text-center bg-slate-50 border border-gray-300 rounded-lg text-slate-850 font-bold font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>

                          {/* Variance Alert box & required reason dropdown */}
                          {devVal !== 0 && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-red-500 flex items-center gap-1">
                                  <AlertCircle className="w-13 h-3 text-red-500" /> Discrepancy Margin: {devVal > 0 ? '+' : ''}{devVal} units
                                </span>
                              </div>
                              <select
                                value={reasonCodes[item.productId] || ''}
                                onChange={(e) => setReasonCodes({
                                  ...reasonCodes,
                                  [item.productId]: e.target.value
                                })}
                                className="w-full p-1.5 bg-yellow-50 border border-yellow-250 rounded-lg text-[10px] text-yellow-905 font-bold focus:ring-1 focus:ring-yellow-500 cursor-pointer"
                              >
                                <option value="">-- Choose Deviation Justification --</option>
                                <option value="Count Clerical Typo">Count Clerical Typo</option>
                                <option value="Unresolved Shrinkage (Theft)">Unresolved Shrinkage (Theft)</option>
                                <option value="Water Damage / Spoilage">Water Damage / Spoilage</option>
                                <option value="Shipper Delivery Defect">Shipper Delivery Defect</option>
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => handleReconcileCycleCount(activeSession)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  Confirm Physical Ledger Check
                </button>
              </div>
            )}

            {/* RECONCILED view items */}
            {activeSession.status === 'RECONCILED' && (
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Audit Items Verified</span>
                <div className="bg-white border rounded-xl divide-y divide-gray-100 font-mono text-[10px]">
                  {activeSession.items.map(item => (
                    <div key={item.productId} className="p-2.5 flex justify-between items-center bg-white">
                      <div>
                        <span className="font-medium text-slate-850 block">{item.productName}</span>
                        <span className="text-slate-400 font-sans">Variance: {item.variance! > 0 ? '+' : ''}{item.variance} ({item.reasonCode})</span>
                      </div>
                      <div className="text-right font-bold text-slate-800">
                        Phys: {item.actualQuantity} / {item.expectedQuantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-sm text-slate-700">Audit Docket Terminal</p>
            <p className="text-xs text-slate-450 max-w-xs mx-auto">Select a count session or generate physical audit dockets from low safety bands to inspect variance logs.</p>
          </div>
        )}
      </div>

    </div>
  );
}
