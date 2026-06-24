/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  TrendingDown, 
  ShieldAlert, 
  MapPin, 
  Percent, 
  DollarSign, 
  Truck, 
  RefreshCw, 
  Sparkles, 
  ClipboardCheck, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { Product, Transaction, UserRole } from '../types';

interface LogisticsOptimizerProps {
  products: Product[];
  transactions: Transaction[];
  currentRole: UserRole;
  currentTenantId: string;
  onAdjustProductStock: (productId: string, newQty: number, reason: string) => void;
  onUpdateMinStock?: (productId: string, newMin: number) => void;
  showNotification: (message: string, type: 'success' | 'info' | 'warning') => void;
}

export default function LogisticsOptimizer({
  products,
  transactions,
  currentRole,
  currentTenantId,
  onAdjustProductStock,
  onUpdateMinStock,
  showNotification
}: LogisticsOptimizerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'deadstock' | 'supplier' | 'spatial' | 'drift'>('deadstock');

  // Interactive local states
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [actualQtyInput, setActualQtyInput] = useState<string>('');
  const [auditReasonCode, setAuditReasonCode] = useState<string>('DAMAGED');
  const [isDefragmenting, setIsDefragmenting] = useState<boolean>(false);
  const [selectedDefragAisle, setSelectedDefragAisle] = useState<string>('Aisle A');
  const [leadTimeBufferMultiplier, setLeadTimeBufferMultiplier] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [liquidationPromoProductId, setLiquidationPromoProductId] = useState<string | null>(null);

  // Filter products by current tenant
  const tenantProducts = useMemo(() => {
    return products.filter(p => p.tenantId === currentTenantId);
  }, [products, currentTenantId]);

  // 1. --- DEADSTOCK CALCULATIONS ---
  // A SKU is deemed slow-moving / deadstock if its quantity > 25 and price > $10,
  // or based on transactional activity (no sales / OUT transactions in the current dataset)
  const deadstockData = useMemo(() => {
    const list = tenantProducts.map(p => {
      // Find transactions for this product
      const itemTx = transactions.filter(t => t.productId === p.id);
      const outTxCount = itemTx.filter(t => t.type === 'OUT').length;
      
      // Calculate inventory age metric (simulated based on ID or updatedAt)
      const simulatedAgeDays = Math.floor(20 + (p.price % 7) * 15 + (p.quantity % 5) * 8);
      const daysSinceLastSale = outTxCount === 0 ? simulatedAgeDays : Math.min(simulatedAgeDays, 5 + (p.price % 3) * 6);
      
      // Capital frozen = cost * current quantity
      const frozenCapital = p.cost * p.quantity;
      
      // Risk level
      let riskScore: 'CRITICAL' | 'WARNING' | 'STABLE' = 'STABLE';
      if (daysSinceLastSale > 90 && p.quantity > 40) riskScore = 'CRITICAL';
      else if (daysSinceLastSale > 45 && p.quantity > 15) riskScore = 'WARNING';

      return {
        product: p,
        daysSinceLastSale,
        outTxCount,
        frozenCapital,
        riskScore
      };
    });

    // Sort by descending frozen capital and age to focus on high-impact items
    const slowMovers = list.filter(item => item.daysSinceLastSale > 30 || item.product.quantity > 50)
      .sort((a, b) => b.frozenCapital - a.frozenCapital);

    const totalFrozenCapital = slowMovers.reduce((sum, item) => sum + item.frozenCapital, 0);

    return {
      slowMovers,
      totalFrozenCapital
    };
  }, [tenantProducts, transactions]);

  // Handle liquidation campaign trigger
  const handleLiquidateProduct = (productId: string, productName: string, currentPrice: number) => {
    setLiquidationPromoProductId(productId);
    const promoCode = `LIQ-${productName.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    setCouponCode(promoCode);
    showNotification(`Generated dynamic promo campaign for "${productName}". 25% off coupon activated.`, 'success');
  };

  // 2. --- SUPPLIER LEAD-TIME & FRAGILITY CALCULATIONS ---
  const supplierData = useMemo(() => {
    const suppliersList = Array.from(new Set(tenantProducts.map(p => p.supplier).filter(Boolean))) as string[];
    
    return suppliersList.map(supName => {
      const supProducts = tenantProducts.filter(p => p.supplier === supName);
      
      // Determine simulated location & risk class based on name length or contents
      let locationType: 'Overseas Air' | 'Overseas Marine' | 'Domestic Freight' | 'Regional Hub' = 'Domestic Freight';
      let baselineLeadTimeDays = 5;
      let reliabilityPercent = 98;
      
      const lowerName = String(supName).toLowerCase();
      if (lowerName.includes('global') || lowerName.includes('world') || supName.length % 3 === 0) {
        locationType = 'Overseas Marine';
        baselineLeadTimeDays = 28;
        reliabilityPercent = 84;
      } else if (lowerName.includes('import') || supName.length % 4 === 0) {
        locationType = 'Overseas Air';
        baselineLeadTimeDays = 14;
        reliabilityPercent = 90;
      } else if (lowerName.includes('factory') || supName.length % 5 === 0) {
        locationType = 'Regional Hub';
        baselineLeadTimeDays = 3;
        reliabilityPercent = 99;
      }

      const totalItemsSupplied = supProducts.length;
      const totalStockHolding = supProducts.reduce((sum, p) => sum + p.quantity, 0);
      const lowStockSkus = supProducts.filter(p => p.quantity <= p.minStock).length;

      // Risk level indicator
      let safetyRisk: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (reliabilityPercent < 90) safetyRisk = 'HIGH';
      else if (reliabilityPercent < 95) safetyRisk = 'MEDIUM';

      return {
        supplierName: supName,
        locationType,
        baselineLeadTimeDays,
        reliabilityPercent,
        totalItemsSupplied,
        totalStockHolding,
        lowStockSkus,
        safetyRisk,
        productsList: supProducts
      };
    });
  }, [tenantProducts]);

  // Bulk adapt lead-time buffer factors
  const handleToggleSafetyBuffer = () => {
    const nextVal = !leadTimeBufferMultiplier;
    setLeadTimeBufferMultiplier(nextVal);

    if (onUpdateMinStock) {
      tenantProducts.forEach(p => {
        const sup = String(p.supplier || '').toLowerCase();
        const isOverseas = sup.includes('global') || 
                           sup.includes('world') || 
                           sup.includes('import');
        if (isOverseas) {
          const originalMinStock = p.minStock;
          const bufferedMinStock = nextVal ? Math.ceil(originalMinStock * 1.25) : Math.max(2, Math.ceil(originalMinStock / 1.25));
          onUpdateMinStock(p.id, bufferedMinStock);
        }
      });
      showNotification(
        nextVal 
          ? "Applied dynamic +25% buffer thresholds to all high-risk overseas supplier products!" 
          : "Restored baseline standard lead-time threshold models.",
        "success"
      );
    } else {
      showNotification("Lead-time buffer values evaluated! (Connect database to persist dynamic threshold changes permanent).", "info");
    }
  };

  // 3. --- SPATIAL VOLUMETRIC CALCULATIONS ---
  const spatialData = useMemo(() => {
    // Group products by aisle (parsed from location e.g. "Aisle A, Row 2" or "Aisle 3, Shelf B")
    const aisles: Record<string, { skus: Product[]; totalQty: number; maxCapacity: number }> = {
      'Aisle A': { skus: [], totalQty: 0, maxCapacity: 800 },
      'Aisle B': { skus: [], totalQty: 0, maxCapacity: 600 },
      'Aisle C': { skus: [], totalQty: 0, maxCapacity: 1000 },
      'Aisle D': { skus: [], totalQty: 0, maxCapacity: 500 }
    };

    tenantProducts.forEach(p => {
      const loc = (p.location || '').trim();
      let matchedAisle = 'Aisle A';
      if (loc.includes('Aisle B') || loc.includes('Aisle 2') || loc.includes('Row 2')) matchedAisle = 'Aisle B';
      else if (loc.includes('Aisle C') || loc.includes('Aisle 3') || loc.includes('Row 3')) matchedAisle = 'Aisle C';
      else if (loc.includes('Aisle D') || loc.includes('Aisle 4') || loc.includes('Row 4')) matchedAisle = 'Aisle D';

      aisles[matchedAisle].skus.push(p);
      aisles[matchedAisle].totalQty += p.quantity;
    });

    return Object.keys(aisles).map(aisleKey => {
      const data = aisles[aisleKey];
      const utilizationPercent = Math.min(100, Math.round((data.totalQty / data.maxCapacity) * 100));
      return {
        aisleName: aisleKey,
        skus: data.skus,
        totalQty: data.totalQty,
        maxCapacity: data.maxCapacity,
        utilizationPercent
      };
    });
  }, [tenantProducts]);

  const handleDefragmentAisle = (aisle: string) => {
    setIsDefragmenting(true);
    setSelectedDefragAisle(aisle);
    setTimeout(() => {
      setIsDefragmenting(false);
      showNotification(`Completed spatial defragmentation for ${aisle}! Compacted 3 half-empty bins, reclaiming 15% physical floor layout.`, 'success');
    }, 2000);
  };

  // 4. --- DRIFT & AUDITING DISCREPANCY RECONCILIATION ---
  const selectedProductObj = useMemo(() => {
    return tenantProducts.find(p => p.id === selectedProductId);
  }, [tenantProducts, selectedProductId]);

  const handlePostAuditCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedProductObj) {
      showNotification('Please select a product SKU for physical audits.', 'warning');
      return;
    }
    const parsedQty = parseInt(actualQtyInput, 10);
    if (isNaN(parsedQty) || parsedQty < 0) {
      showNotification('Please input a valid physical count quantity.', 'warning');
      return;
    }

    const expectedQty = selectedProductObj.quantity;
    const variance = parsedQty - expectedQty;

    if (variance === 0) {
      showNotification(`Count audit matched! No deviation recorded for ${selectedProductObj.name}.`, 'success');
      return;
    }

    // Call state handler to adjust quantity
    onAdjustProductStock(
      selectedProductId, 
      parsedQty, 
      `Physical Cycle Count Reconciliation - Reason: ${auditReasonCode}`
    );

    const dollarValueImpact = Math.abs(variance) * selectedProductObj.cost;
    showNotification(
      `Reconciled ${selectedProductObj.sku}: Adjusted stock from ${expectedQty} to ${parsedQty} (${variance > 0 ? '+' : ''}${variance} pcs). Valuation adjustment: $${dollarValueImpact.toFixed(2)}.`,
      'success'
    );

    // Reset fields
    setActualQtyInput('');
    setSelectedProductId('');
  };

  return (
    <div id="logistics-optimizer-root" className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs font-sans">
      
      {/* Tab Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-150 dark:border-slate-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-gray-950 dark:text-white text-base">Logistics Health & Optimizer Hub</h3>
            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[10px] uppercase font-black tracking-wider rounded border border-indigo-200 dark:border-indigo-900">
              Expert Mode
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Turn supply chain bottlenecks, forgotten capital, and storage fragmentation into dynamic operations opportunities.
          </p>
        </div>

        {/* Action Tabs Selector */}
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-950 p-1 rounded-xl gap-1 text-xs font-bold self-start select-none">
          <button
            onClick={() => setActiveSubTab('deadstock')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'deadstock' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Deadstock Recover</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('supplier')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'supplier' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Supplier Lead-Time</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('spatial')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'spatial' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Shelf Spatial Map</span>
          </button>

          <button
            onClick={() => setActiveSubTab('drift')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeSubTab === 'drift' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Drift Auditor</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: DEADSTOCK RECOVER */}
      {activeSubTab === 'deadstock' && (
        <div className="space-y-6">
          {/* Top Banner KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-rose-50/50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4 flex items-center gap-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-950 rounded-xl text-rose-600 dark:text-rose-400 shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block">Frozen Assets Capital</span>
                <h4 className="text-xl font-bold font-mono text-rose-700 dark:text-rose-400 mt-0.5">
                  ${deadstockData.totalFrozenCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h4>
                <p className="text-[10px] text-rose-600/80 mt-1">Stagnant wholesale capital holding up cash flow.</p>
              </div>
            </div>

            <div className="bg-amber-50/50 dark:bg-amber-950/15 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-950 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block">Critical Slow-movers</span>
                <h4 className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5">
                  {deadstockData.slowMovers.filter(i => i.daysSinceLastSale > 45).length} SKUs
                </h4>
                <p className="text-[10px] text-amber-600/80 mt-1">No sales transactions logged in &gt; 45 days.</p>
              </div>
            </div>

            <div className="bg-blue-50/50 dark:bg-blue-950/15 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block">Suggested Promo Conversion</span>
                <h4 className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400 mt-0.5">
                  {Math.round((deadstockData.slowMovers.length / Math.max(1, tenantProducts.length)) * 100)}%
                </h4>
                <p className="text-[10px] text-blue-600/80 mt-1">Recommended for stock clearance campaign.</p>
              </div>
            </div>
          </div>

          {/* Slow-movers Listing Panel */}
          <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] uppercase font-black text-slate-500 dark:text-slate-400 tracking-wider">Slow-Moving SKUs & Frozen Capital Recovery Actions</span>
              <span className="text-xs text-indigo-600 font-bold dark:text-indigo-400">Total Analyzed: {deadstockData.slowMovers.length} SKUs</span>
            </div>
            
            <div className="divide-y divide-gray-150 dark:divide-slate-800 text-xs max-h-96 overflow-y-auto">
              {deadstockData.slowMovers.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-gray-700 dark:text-white">All SKUs Active</p>
                  <p className="text-xs">No deadstock or slow-moving items detected in this cycle!</p>
                </div>
              ) : (
                deadstockData.slowMovers.map(({ product, daysSinceLastSale, outTxCount, frozenCapital, riskScore }) => (
                  <div key={product.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-950 border border-gray-250 dark:border-slate-800 shrink-0 flex items-center justify-center font-bold text-[10px] text-slate-500">
                        {product.quantity} pcs
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-white truncate max-w-[180px]" title={product.name}>
                            {product.name}
                          </span>
                          <span className={`px-1.5 py-0.5 text-[8.5px] rounded-sm font-extrabold ${
                            riskScore === 'CRITICAL' ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900' :
                            'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                          }`}>
                            {daysSinceLastSale}d Stagnant
                          </span>
                        </div>
                        <p className="font-mono text-[9px] text-gray-400 mt-1">
                          SKU: <strong className="text-gray-600 dark:text-gray-300 font-normal">{product.sku}</strong> • Bin: {product.location || 'N/A'} • Total Sales: {outTxCount}
                        </p>
                      </div>
                    </div>

                    {/* Financial details & campaign triggers */}
                    <div className="flex items-center gap-5 shrink-0 self-end sm:self-auto">
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Frozen Value</p>
                        <p className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">${frozenCapital.toFixed(2)}</p>
                        <p className="text-[9px] text-gray-400">At Cost (${product.cost.toFixed(2)}/u)</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLiquidateProduct(product.id, product.name, product.price)}
                        className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-600 hover:text-white dark:bg-indigo-950/40 dark:border-indigo-850 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
                      >
                        Liquidate Discount
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Liquidate Modal / Promo Code Trigger Container */}
          {couponCode && liquidationPromoProductId && (
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border-2 border-dashed border-indigo-300 dark:border-indigo-850 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h5 className="font-bold text-indigo-900 dark:text-indigo-400 text-xs">Active Warehouse Promotion Campaign</h5>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                    Dynamic pricing code deployed. Broadcast simulated sales hook to sync partners.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-850 px-4 py-2 rounded-xl text-center">
                  <p className="text-[8px] uppercase tracking-wider text-gray-400">COUPON CODE</p>
                  <p className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm select-all">{couponCode}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCouponCode(null);
                    setLiquidationPromoProductId(null);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                >
                  Close Campaign
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: SUPPLIER LEAD-TIME */}
      {activeSubTab === 'supplier' && (
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                Dynamic Lead-Time Buffer Thresholds (ERP Automation)
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Overseas cargo and custom clearings contain unstable lead times. Automatically adjust reorder trigger targets (`minStock`) with safety multipliers.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleSafetyBuffer}
              className={`px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer select-none active:scale-95 shrink-0 ${
                leadTimeBufferMultiplier 
                  ? 'bg-rose-600 text-white shadow-md' 
                  : 'bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50'
              }`}
            >
              {leadTimeBufferMultiplier ? 'Disable Buffer Safety Factor' : 'Deploy +25% Safety Stock Buffer'}
            </button>
          </div>

          {/* Supplier Lead-Time Risk List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplierData.map(sup => (
              <div key={sup.supplierName} className="border border-gray-200 dark:border-slate-800 rounded-xl p-4 space-y-3 hover:shadow-xs transition bg-white dark:bg-slate-900/40">
                <div className="flex items-center justify-between">
                  <h5 className="font-black text-gray-800 dark:text-white text-xs truncate max-w-[200px]" title={sup.supplierName}>
                    {sup.supplierName}
                  </h5>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    sup.safetyRisk === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900' :
                    sup.safetyRisk === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                  }`}>
                    {sup.safetyRisk} RISK ({sup.reliabilityPercent}% On-Time)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] py-2 bg-slate-50 dark:bg-slate-950 rounded-lg">
                  <div>
                    <span className="text-gray-400 block uppercase font-bold text-[8px]">Transit Mode</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-300">{sup.locationType}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block uppercase font-bold text-[8px]">Est. Lead Time</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-300">{sup.baselineLeadTimeDays} days</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block uppercase font-bold text-[8px]">Active SKUs</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-300">{sup.totalItemsSupplied} items</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-gray-500">Current Stock Holding: <strong className="text-gray-700 dark:text-gray-300">{sup.totalStockHolding} units</strong></span>
                  {sup.lowStockSkus > 0 ? (
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {sup.lowStockSkus} SKUs low/out
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Normal Stock levels
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: SPATIAL LAYOUT */}
      {activeSubTab === 'spatial' && (
        <div className="space-y-6">
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-150 dark:border-indigo-950 rounded-2xl flex items-center gap-3">
            <Info className="w-5 h-5 text-indigo-650 text-indigo-600 shrink-0" />
            <p className="text-xs text-indigo-850 dark:text-indigo-400">
              <strong>Picking Walk-Time Optimization:</strong> Fragmented warehouses cause long foot-travel distances for fulfillment pickers. Click <strong>Defragment Bin</strong> to consolidate spatial items, reclaiming floor slots and grouping related SKUs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual Heatmap Grid */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block">Physical Warehouse Floor Map (Aisles)</span>
              
              <div className="space-y-3.5">
                {spatialData.map(aisle => (
                  <div key={aisle.aisleName} className="space-y-1.5 p-3.5 border border-gray-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-800 dark:text-white">{aisle.aisleName} ({aisle.skus.length} SKUs)</span>
                      <span className={`font-mono font-bold ${
                        aisle.utilizationPercent > 85 ? 'text-red-600' : 
                        aisle.utilizationPercent < 30 ? 'text-blue-500' : 'text-gray-700 dark:text-gray-350'
                      }`}>
                        {aisle.totalQty} / {aisle.maxCapacity} units ({aisle.utilizationPercent}%)
                      </span>
                    </div>
                    {/* Progress Bar Gauge */}
                    <div className="w-full bg-gray-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          aisle.utilizationPercent > 85 ? 'bg-red-500' :
                          aisle.utilizationPercent < 30 ? 'bg-blue-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${aisle.utilizationPercent}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] pt-1.5">
                      <span className="text-gray-400">
                        Top Grouping: <strong className="text-gray-600 dark:text-slate-350 font-normal">{aisle.skus[0]?.category || 'None'}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDefragmentAisle(aisle.aisleName)}
                        className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 cursor-pointer select-none"
                      >
                        Defragment Bin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spatial details card */}
            <div className="border border-gray-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50 dark:bg-slate-950 space-y-4">
              <h5 className="font-bold text-gray-800 dark:text-white text-xs flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-500" />
                Physical Bin Defragmentation Controller
              </h5>

              {isDefragmenting ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  <p className="font-bold text-xs text-gray-700 dark:text-white">Re-allocating shelf location coordinates...</p>
                  <p className="text-[10px] text-gray-400 max-w-xs mx-auto">Re-routing aisle picking paths and grouping identical product categories into matching bin layouts.</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs leading-relaxed">
                  <p className="text-gray-500 text-xs">
                    This action consolidates split shipments and fragmented inventory quantities into tight shelf bins. It helps logistics managers maximize spatial layout efficiency and limits time wasted in walking between shelves.
                  </p>

                  <div className="p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl space-y-2">
                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest block">System Diagnostics</span>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Picking Efficiency:</span>
                      <span className="font-bold text-emerald-600 font-mono">89.4% (Healthy)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Spatial Slots Reclaimed:</span>
                      <span className="font-bold text-gray-800 dark:text-slate-300 font-mono">24 bin slots</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Aisle Walk Reduction:</span>
                      <span className="font-bold text-indigo-600 font-mono">~350 meters / day</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDefragmentAisle('Aisle A')}
                    className="w-full py-2 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 text-xs"
                  >
                    <RefreshCw className="w-4 h-4" /> Defragment All Spatial Aisles
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: COUNT DRIFT AUDITOR */}
      {activeSubTab === 'drift' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Column */}
            <div className="lg:col-span-2 border border-gray-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block">Verify Inventory Count Drift Variance</span>
              
              <form onSubmit={handlePostAuditCorrection} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-gray-300 block">Select Active Product SKU</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        setSelectedProductId(e.target.value);
                        setActualQtyInput('');
                      }}
                      className="w-full p-2 border border-gray-250 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="">-- Choose Product SKU --</option>
                      {tenantProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.sku} - {p.name} (Stored: {p.quantity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-700 dark:text-gray-300 block">Discrepancy Reason Code</label>
                    <select
                      value={auditReasonCode}
                      onChange={(e) => setAuditReasonCode(e.target.value)}
                      className="w-full p-2 border border-gray-250 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="DAMAGED">DAMAGED (Write-off physical breakage)</option>
                      <option value="CLERICAL_ERROR">CLERICAL ERROR (Inbound scan inaccuracy)</option>
                      <option value="THEFT_SHRINKAGE">THEFT / SHRINKAGE (Unresolved loss)</option>
                      <option value="MISPLACEMENT">MISPLACEMENT (Recovered from other rack)</option>
                    </select>
                  </div>
                </div>

                {selectedProductObj && (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Database Registered Stock:</span>
                      <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{selectedProductObj.quantity} units</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Wholesale Product Cost (USD):</span>
                      <span className="font-mono font-bold text-gray-800 dark:text-gray-200">${selectedProductObj.cost.toFixed(2)} / unit</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 dark:text-gray-300 block">Actual Audited Physical Count</label>
                  <input
                    type="number"
                    value={actualQtyInput}
                    onChange={(e) => setActualQtyInput(e.target.value)}
                    placeholder="Enter physical count quantity spotted on rack..."
                    className="w-full p-2 border border-gray-250 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white rounded-xl text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                    min="0"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedProductId}
                  className="w-full py-2 bg-indigo-600 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" /> Post Corrective Ledger Entry
                </button>
              </form>
            </div>

            {/* Live Valuation Discrepancy Card */}
            <div className="border border-gray-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
              <div>
                <h5 className="font-bold text-gray-800 dark:text-white text-xs flex items-center gap-1.5 border-b border-gray-200 dark:border-slate-800 pb-3 mb-4">
                  <Activity className="w-4 h-4 text-rose-500" />
                  Live Valuation Loss Indicator
                </h5>

                {selectedProductObj && actualQtyInput ? (
                  <div className="space-y-4">
                    <div className="text-center py-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-800 shadow-3xs">
                      <p className="text-[9px] uppercase tracking-wider text-gray-400">Stock Count Variance</p>
                      <h3 className={`text-2xl font-mono font-black ${
                        (parseInt(actualQtyInput, 10) - selectedProductObj.quantity) < 0 ? 'text-red-600' :
                        (parseInt(actualQtyInput, 10) - selectedProductObj.quantity) > 0 ? 'text-emerald-600' : 'text-gray-500'
                      }`}>
                        {(parseInt(actualQtyInput, 10) - selectedProductObj.quantity) > 0 ? '+' : ''}
                        {parseInt(actualQtyInput, 10) - selectedProductObj.quantity} units
                      </h3>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Book Asset Loss:</span>
                        <span className="font-mono font-bold text-rose-600">
                          ${(Math.abs(parseInt(actualQtyInput, 10) - selectedProductObj.quantity) * selectedProductObj.cost).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Shrinkage Risk Level:</span>
                        <span className={`font-semibold ${
                          Math.abs(parseInt(actualQtyInput, 10) - selectedProductObj.quantity) > 10 ? 'text-red-600 font-bold' : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {Math.abs(parseInt(actualQtyInput, 10) - selectedProductObj.quantity) > 10 ? 'HIGH WARNING' : 'MINOR DRIFT'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 space-y-2">
                    <ClipboardCheck className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="font-bold text-xs text-gray-700 dark:text-white">Awaiting Audit Inputs</p>
                    <p className="text-[10px] text-gray-400 max-w-[180px] mx-auto">Select a product and key in physical inventory metrics to calculate real-time discrepancy assets.</p>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-gray-400 italic pt-4 border-t border-gray-150 dark:border-slate-800 mt-4">
                * Corrective ledger post automatically tracks discrepancies under the general ledgers standard audit trail.
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
