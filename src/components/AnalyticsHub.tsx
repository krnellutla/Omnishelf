import React, { useState } from 'react';
import { BarChart3, HelpCircle, FileSpreadsheet, Key, Play, Terminal, Plus, Trash, Globe, Send, CircleDot } from 'lucide-react';
import { Product, WebhookLog, UserRole } from '../types';

interface AnalyticsHubProps {
  products: Product[];
  currentRole: UserRole;
  webhookLogs: WebhookLog[];
  onTriggerWebhook: (event: string, payload: any) => void;
}

export default function AnalyticsHub({
  products,
  currentRole,
  webhookLogs,
  onTriggerWebhook
}: AnalyticsHubProps) {
  const [activeTab, setActiveTab] = useState<'reports' | 'webhooks'>('reports');
  
  // Custom report builder state
  const [groupBy, setGroupBy] = useState<'category' | 'supplier' | 'location'>('category');
  const [showCost, setShowCost] = useState(true);
  const [showRetail, setShowRetail] = useState(true);
  
  // Webhooks simulation state
  const [selectedEvent, setSelectedEvent] = useState<string>('inventory.stock.low');
  const [webhookUrl, setWebhookUrl] = useState<'https://mock-company-crm.io/endpoints/webhook' | string>('https://enterprise-gateway.customer.io/endpoint/receive-ledger');

  const getAbcRating = (cost: number) => {
    if (cost >= 45) return 'Class A';
    if (cost >= 15) return 'Class B';
    return 'Class C';
  };

  // Generate grouped reports data
  const generateReportData = () => {
    const rawData: Record<string, { skusCount: number, qtySum: number, costValue: number, retailValue: number, lowStockSkus: number }> = {};

    products.forEach(p => {
      const groupKey = p[groupBy] || 'Unallocated';
      if (!rawData[groupKey]) {
        rawData[groupKey] = { skusCount: 0, qtySum: 0, costValue: 0, retailValue: 0, lowStockSkus: 0 };
      }

      rawData[groupKey].skusCount += 1;
      rawData[groupKey].qtySum += p.quantity;
      rawData[groupKey].costValue += (p.cost * p.quantity);
      rawData[groupKey].retailValue += (p.price * p.quantity);
      
      if (p.quantity <= p.minStock) {
        rawData[groupKey].lowStockSkus += 1;
      }
    });

    return Object.keys(rawData).map(key => ({
      groupName: key,
      ...rawData[key]
    }));
  };

  // Trigger simulated webhook
  const handleTriggerWebhookSimulation = () => {
    let mockPayload: any = {};
    const timestamp = new Date().toISOString();

    if (selectedEvent === 'inventory.stock.low') {
      const lowProd = products.find(p => p.quantity <= p.minStock) || products[0];
      mockPayload = {
        event: 'inventory.stock.low',
        timestamp,
        tenantId: lowProd?.tenantId || 'tenant-apex',
        alert: {
          productId: lowProd?.id || 'prod-unknown',
          sku: lowProd?.sku || 'SKU-000',
          name: lowProd?.name || 'Unknown item',
          currentQuantity: lowProd?.quantity ?? 0,
          thresholdLimit: lowProd?.minStock ?? 5,
          supplierName: lowProd?.supplier || 'Default Vendor'
        }
      };
    } else if (selectedEvent === 'order.shipped') {
      mockPayload = {
        event: 'order.shipped',
        timestamp,
        tenantId: products[0]?.tenantId || 'tenant-apex',
        carrierMetrics: {
          consignmentId: `TRK-DHL-${Math.floor(100000000 + Math.random() * 900000000)}`,
          courierIdentity: 'DHL Express',
          serviceName: 'International Priority air',
          assessedVolumetricWeightKg: 1.85,
          costValuationUSD: 24.50
        }
      };
    } else {
      mockPayload = {
        event: 'purchase_order.received',
        timestamp,
        tenantId: products[0]?.tenantId || 'tenant-apex',
        complianceAssessment: {
          purchaseOrderId: `PO-${Math.floor(100000 + Math.random() * 900000)}`,
          complianceMatchResult: 'MATCHED',
          invoiceAuditedAmt: 1450.00,
          overShortDamageDetected: false
        }
      };
    }

    onTriggerWebhook(selectedEvent, mockPayload);
  };

  const reportItemsList = generateReportData();

  return (
    <div id="analytics-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* Left side parameters & tables */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-5">
          <div>
            <h3 className="font-bold text-gray-950 text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-650 text-indigo-600" /> Custom Analytics & Webhooks
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Construct ad-hoc inventory valuation reports or test live event-driven webhooks.
            </p>
          </div>
          
          <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5 text-xs font-bold shrink-0 self-start">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'reports' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Custom Report Builder
            </button>
            <button
              onClick={() => setActiveTab('webhooks')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'webhooks' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              API Webhooks Simulation
            </button>
          </div>
        </div>

        {activeTab === 'reports' && (
          <div className="space-y-5">
            {/* Controls panel */}
            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-4 text-xs font-sans">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Query Parameters Engine</span>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-705">Group Dimensions By:</span>
                  <select
                    value={groupBy}
                    onChange={(e: any) => setGroupBy(e.target.value)}
                    className="p-1.5 border border-gray-250 bg-white rounded-lg text-slate-800 font-bold cursor-pointer transition focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="category">Category Segment</option>
                    <option value="supplier">Supplier Entity</option>
                    <option value="location">Bin Location Map</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 text-[11px] font-bold text-slate-650">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={showCost} onChange={(e) => setShowCost(e.target.checked)} className="rounded" />
                    <span>Cost Pool Valuation</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={showRetail} onChange={(e) => setShowRetail(e.target.checked)} className="rounded" />
                    <span>Retail Value Margins</span>
                  </label>
                </div>

                <button
                  onClick={() => alert("Report Export initialized! Commencing CSV generation on directory background threads.")}
                  className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-slate-700 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-gray-500" /> Export CSV
                </button>
              </div>
            </div>

            {/* Generated Reports Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden text-xs font-sans">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-slate-450 font-bold uppercase text-[9px] tracking-wider">
                    <th className="px-4 py-2.5">Dimension Name</th>
                    <th className="px-4 py-2.5 text-center">SKUs</th>
                    <th className="px-4 py-2.5 text-center">Sum Quantities</th>
                    <th className="px-4 py-2.5 text-center text-red-500">Stockouts</th>
                    {showCost && <th className="px-4 py-2.5 text-right">Cost Asset Base</th>}
                    {showRetail && <th className="px-4 py-2.5 text-right">Potential Sales Value</th>}
                    {showCost && showRetail && <th className="px-4 py-2.5 text-right">Gros Profit %</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {reportItemsList.map(item => {
                    const grossProfitDiff = item.retailValue - item.costValue;
                    const marginPct = item.retailValue > 0 ? (grossProfitDiff / item.retailValue) * 100 : 0;

                    return (
                      <tr key={item.groupName} className="hover:bg-slate-50 font-sans">
                        <td className="px-4 py-3 font-bold text-slate-800">{item.groupName}</td>
                        <td className="px-4 py-3 text-center text-slate-505 font-medium">{item.skusCount} items</td>
                        <td className="px-4 py-3 text-center text-slate-800 font-extrabold">{item.qtySum} units</td>
                        <td className="px-4 py-3 text-center">
                          {item.lowStockSkus > 0 ? (
                            <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 text-[10px] font-black rounded-full text-center">
                              {item.lowStockSkus} low
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium font-sans">Normal</span>
                          )}
                        </td>
                        {showCost && <td className="px-4 py-3 text-right font-mono font-bold text-slate-650">${item.costValue.toFixed(2)}</td>}
                        {showRetail && <td className="px-4 py-3 text-right font-mono font-bold text-slate-850">${item.retailValue.toFixed(2)}</td>}
                        {showCost && showRetail && (
                          <td className="px-4 py-3 text-right font-mono font-black text-teal-600">
                            {marginPct.toFixed(1)}%
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Webhooks custom setup workspace tab */}
        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-4 text-xs select-none">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Developer Webhook Gateway</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">Configure Callback Destination URL</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400"><Globe className="w-3.5 h-3.5" /></span>
                    <input
                      type="text"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-slate-800 font-semibold focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">Choose Event Type Trigger</label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full p-1.5 bg-white border border-gray-20s border-gray-200 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="inventory.stock.low">inventory.stock.low (Out of Bounds notice)</option>
                    <option value="order.shipped">order.shipped (Consignment label release)</option>
                    <option value="purchase_order.received">purchase_order.received (Audit match assessment)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleTriggerWebhookSimulation}
                className="px-4 py-2 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" /> Fire Simulated Server Hook
              </button>
            </div>

            {/* active webhook emitting logs */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Emitted Webhook Payloads Logger</span>
              
              <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="px-4 py-2">Event Scope</th>
                      <th className="px-4 py-2">Timestamp log</th>
                      <th className="px-4 py-2 text-right">Endpoint Destination</th>
                      <th className="px-4 py-2 text-center font-mono">Return status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {webhookLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                          Trigger standard hooks above to view output payload streams.
                        </td>
                      </tr>
                    ) : (
                      webhookLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 select-text">
                          <td className="px-4 py-2.5 font-bold font-mono text-indigo-650 text-[11px] flex items-center gap-1.5">
                            <CircleDot className="w-3.5 h-3.5 text-indigo-500" /> {log.event}
                          </td>
                          <td className="px-4 py-2.5 text-slate-400 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td className="px-4 py-2.5 text-right text-slate-500 truncate max-w-xs">{webhookUrl}</td>
                          <td className="px-4 py-2.5 text-center font-mono font-bold text-emerald-600 font-sans">
                            HTTP 200 OK
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right side live console JSON view */}
      <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 space-y-6 select-text">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest font-mono">Dossier Terminal Viewer</span>
          </div>
          <button
            onClick={() => alert("Code snippets are formatted for live CRM APIs.")}
            className="text-[9px] uppercase font-black text-slate-400 hover:text-slate-850"
          >
            Payload Help
          </button>
        </div>

        {webhookLogs.length > 0 ? (
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Last Sync Hook JSON Raw Body</span>
            <div className="bg-slate-950 text-slate-350 p-4 rounded-xl font-mono text-[10px] max-h-96 overflow-y-auto leading-relaxed select-text border border-slate-900 border-t-4 border-t-indigo-600 shadow-sm scrollbar-thin">
              <pre className="whitespace-pre-wrap">{JSON.stringify(JSON.parse(webhookLogs[0].payload), null, 2)}</pre>
            </div>
          </div>
        ) : (
          <div className="text-center py-24 text-slate-400 space-y-2">
            <Terminal className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-sm text-slate-700">Payload Console</p>
            <p className="text-xs text-slate-450 max-w-xs mx-auto">Emitting a webhooks event logs here will render standard JSON-formatted transaction streams live in this window.</p>
          </div>
        )}
      </div>

    </div>
  );
}
