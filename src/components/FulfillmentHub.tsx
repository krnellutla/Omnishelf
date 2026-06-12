import React, { useState } from 'react';
import { Truck, Package, Clipboard, Tag, CheckCircle, RefreshCw, AlertTriangle, CheckSquare, Printer, Award, CornerDownLeft } from 'lucide-react';
import { SalesOrder, SalesOrderItem, UserRole } from '../types';

interface FulfillmentHubProps {
  salesOrders: SalesOrder[];
  currentRole: UserRole;
  onUpdateSalesOrder: (order: SalesOrder) => void;
  onShipInventory: (productId: string, qty: number, reason: string) => void;
  onReturnInventory: (productId: string, qty: number, disposition: 'RESTOCKED' | 'WRITE_OFF') => void;
}

interface CarrierQuote {
  carrier: string;
  serviceName: string;
  cost: number;
  days: number;
  rating: string;
}

export default function FulfillmentHub({
  salesOrders,
  currentRole,
  onUpdateSalesOrder,
  onShipInventory,
  onReturnInventory
}: FulfillmentHubProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'returns' | 'carriers'>('orders');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  // Packing dimensions & selected rates
  const [cargoLength, setCargoLength] = useState<number>(30);
  const [cargoWidth, setCargoWidth] = useState<number>(20);
  const [cargoHeight, setCargoHeight] = useState<number>(15);
  const [cargoWeight, setCargoWeight] = useState<number>(1.5);
  const [selectedQuote, setSelectedQuote] = useState<CarrierQuote | null>(null);

  // Pick/pack states
  const [pickProgress, setPickProgress] = useState<Record<string, number>>({});
  const [isPackVerified, setIsPackVerified] = useState(false);

  // RMA return states
  const [rmaOrderId, setRmaOrderId] = useState('');
  const [rmaReason, setRmaReason] = useState('');
  const [rmaDisposition, setRmaDisposition] = useState<'RESTOCKED' | 'REFURBISHED' | 'WRITE_OFF'>('RESTOCKED');

  // Multi-carrier rate shopping simulator calculations
  const calculateCarrierQuotes = (): CarrierQuote[] => {
    const vol = cargoLength * cargoWidth * cargoHeight;
    const dimWeight = vol / 5000; // standard IATA metric box volumetric divisor
    const billWeight = Math.max(cargoWeight, dimWeight);

    return [
      { carrier: 'SingPost', serviceName: 'Registered Postal parcel', cost: 4.80 + billWeight * 0.8, days: 4, rating: '★★★★☆' },
      { carrier: 'Ninja Van', serviceName: 'Standard Next Day courier', cost: 6.50 + billWeight * 1.2, days: 1, rating: '★★★★★' },
      { carrier: 'J&T Express', serviceName: 'ECO Saver delivery', cost: 5.20 + billWeight * 1.0, days: 2, rating: '★★★★☆' },
      { carrier: 'DHL Express', serviceName: 'International Priority air', cost: 18.50 + billWeight * 3.5, days: 1, rating: '★★★★★' },
      { carrier: 'FedEx', serviceName: 'Priority Ground courier', cost: 14.20 + billWeight * 2.8, days: 2, rating: '★★★★★' },
      { carrier: 'UPS', serviceName: 'Expedited transport', cost: 12.80 + billWeight * 3.0, days: 2, rating: '★★★★☆' }
    ].sort((a,b) => a.cost - b.cost); // sort by cheapest by default
  };

  const handleStartPicking = (order: SalesOrder) => {
    const updated: SalesOrder = {
      ...order,
      status: 'PICKING'
    };
    onUpdateSalesOrder(updated);

    const initialPicks: Record<string, number> = {};
    order.items.forEach(it => {
      initialPicks[it.productId] = 0;
    });
    setPickProgress(initialPicks);
    setIsPackVerified(false);
  };

  const handlePickUnit = (item: SalesOrderItem) => {
    const cur = pickProgress[item.productId] ?? 0;
    if (cur >= item.quantityOrdered) return;

    setPickProgress({
      ...pickProgress,
      [item.productId]: cur + 1
    });
  };

  const handleCompletePicking = (order: SalesOrder) => {
    // Check if fully picked
    const allPicked = order.items.every(item => {
      const p = pickProgress[item.productId] ?? 0;
      return p >= item.quantityOrdered;
    });

    if (!allPicked) {
      alert("Variance detected: Please pick all units matching customer PO requirements.");
      return;
    }

    const updatedItems = order.items.map(item => ({
      ...item,
      quantityPicked: pickProgress[item.productId] ?? item.quantityOrdered
    }));

    const updated: SalesOrder = {
      ...order,
      items: updatedItems,
      status: 'PACKING'
    };
    onUpdateSalesOrder(updated);
  };

  const handlePackConfirm = () => {
    setIsPackVerified(true);
    // Auto-select cheapest quote
    const quotes = calculateCarrierQuotes();
    setSelectedQuote(quotes[0]);
  };

  const handleGenerateLabelAndShip = (order: SalesOrder) => {
    if (!selectedQuote) return;

    const trackingNum = `TRK-${selectedQuote.carrier.substring(0,3).toUpperCase()}-${Math.floor(100000000 + Math.random() * 900000000)}`;

    const updated: SalesOrder = {
      ...order,
      status: 'SHIPPED',
      carrierName: selectedQuote.carrier,
      shippingService: selectedQuote.serviceName,
      shippingCost: selectedQuote.cost,
      trackingNumber: trackingNum,
      trackingStep: 'STAGED',
      trackingLogs: [
        `[${new Date().toLocaleTimeString()}] Shipping Label created at origin terminal.`,
        `[${new Date().toLocaleTimeString()}] Consignment details synced via carrier API.`
      ]
    };
    onUpdateSalesOrder(updated);

    // deduct the physical products quantities from inventory stack
    order.items.forEach(item => {
      onShipInventory(item.productId, item.quantityOrdered, `Shipped customer order (${order.id}) via ${selectedQuote.carrier}.`);
    });

    alert(`Fulfillment Approved! Label generated: ${trackingNum}. Inventory books adjusted automatically.`);
  };

  const handleSimulateTrackingTrip = (order: SalesOrder, step: 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION_HOLD') => {
    const logMap: Record<string, string> = {
      'IN_TRANSIT': `Consignment sorted at local gateway hub. En-route to delivery center.`,
      'OUT_FOR_DELIVERY': `Sorting out completed. Handed to last-mile delivery courier.`,
      'DELIVERED': `Delivery signature recorded. Parcel deposited successfully at dropoff door lock.`,
      'EXCEPTION_HOLD': `Customs clearance exception: commercial invoice inspection required on border.`
    };

    const logs = [...(order.trackingLogs || [])];
    logs.push(`[${new Date().toLocaleTimeString()}] ${logMap[step]}`);

    const updated: SalesOrder = {
      ...order,
      trackingStep: step,
      status: step === 'DELIVERED' ? 'DELIVERED' : order.status,
      trackingLogs: logs
    };
    onUpdateSalesOrder(updated);
  };

  const handleRegisterRMA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rmaOrderId || !rmaReason) return;

    const order = salesOrders.find(o => o.id === rmaOrderId);
    if (!order) {
      alert("Sales order reference target not found.");
      return;
    }

    const updated: SalesOrder = {
      ...order,
      status: 'RMA_REQUESTED',
      rmaReason: rmaReason,
      rmaDisposition: rmaDisposition === 'WRITE_OFF' ? 'WRITE_OFF' : 'RESTOCKED'
    };
    onUpdateSalesOrder(updated);

    // Apply adjustments
    if (rmaDisposition === 'RESTOCKED') {
      order.items.forEach(item => {
        onReturnInventory(item.productId, item.quantityOrdered, 'RESTOCKED');
      });
      alert("RMA authorized! Return stock successfully inspected, written clean, and restocked on terminal shelves.");
    } else {
      order.items.forEach(item => {
        onReturnInventory(item.productId, item.quantityOrdered, 'WRITE_OFF');
      });
      alert("RMA authorized! Shortages logged as transit loss; written off from physical asset capital accounts.");
    }

    setRmaOrderId('');
    setRmaReason('');
    setSelectedOrderId(order.id);
  };

  const selectedOrder = salesOrders.find(o => o.id === selectedOrderId);
  const activeQuotesList = calculateCarrierQuotes();

  return (
    <div id="fulfillment-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* Left side items and selectors lists */}
      <div className="lg:col-span-2 bg-white border border-gray-205 border-gray-200 rounded-2xl p-5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-5">
          <div>
            <h3 className="font-bold text-gray-950 text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-650 text-indigo-600" /> Fulfillment Panel & Carrier Matrix
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Pick orders, verify box dimensions, rate shop shipping couriers, and log customer RMA returns.
            </p>
          </div>
          
          <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5 text-xs font-bold shrink-0 self-start">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'orders' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Order Picking Queue
            </button>
            <button
              onClick={() => setActiveTab('returns')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'returns' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              RMA Returns & RMAs
            </button>
            <button
              onClick={() => setActiveTab('carriers')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'carriers' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Multi-Carrier Quotes
            </button>
          </div>
        </div>

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {salesOrders.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl space-y-3">
                <Truck className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="text-gray-950 font-bold text-sm">No Active Sales Orders</p>
                  <p className="text-xs text-slate-500 font-medium">All dispatch dockets clear. Check back when customers order catalog items.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {salesOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => { setSelectedOrderId(order.id); if (order.status === 'UNFULFILLED') handleStartPicking(order); }}
                    className={`p-4 border rounded-2xl cursor-pointer hover:border-gray-250 transition ${
                      selectedOrderId === order.id ? 'border-indigo-400 bg-indigo-50/20' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-905">{order.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                            order.status === 'UNFULFILLED' ? 'bg-slate-100 text-slate-700 font-extrabold' :
                            order.status === 'PICKING' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                            order.status === 'PACKING' ? 'bg-sky-50 text-sky-700 border border-sky-150' :
                            order.status === 'SHIPPED' ? 'bg-blue-50 text-blue-700 border border-blue-150' :
                            order.status === 'RMA_REQUESTED' ? 'bg-red-50 text-red-700 border border-red-150' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-150'
                          }`}>{order.status}</span>
                        </div>
                        <p className="text-xs text-slate-600 font-semibold">
                          Client: {order.customerName} • Target Dest: {order.deliveryAddress}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium font-mono">Booked: {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>

                      <div className="text-right text-xs">
                        <span className="text-[9px] text-slate-450 block font-bold uppercase">Consignment Value</span>
                        <span className="font-mono font-black text-slate-900">${order.items.reduce((sum, item) => sum + (item.quantityOrdered * item.price), 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RMA Returns configuration tab */}
        {activeTab === 'returns' && (
          <div className="space-y-6">
            <form onSubmit={handleRegisterRMA} className="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-4 text-xs">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Process Authorized RMA Ticket</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Select Originated Order ID</label>
                  <select
                    value={rmaOrderId}
                    onChange={(e) => setRmaOrderId(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Choose Sales Order --</option>
                    {salesOrders.filter(o => o.status !== 'UNFULFILLED' && o.status !== 'RMA_REQUESTED').map(o => (
                      <option key={o.id} value={o.id}>{o.id} ({o.customerName})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Physical Disposition Plan</label>
                  <select
                    value={rmaDisposition}
                    onChange={(e: any) => setRmaDisposition(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="RESTOCKED">Check Quality & Return to Shelves (Restock)</option>
                    <option value="WRITE_OFF">Damaged Return / Write-Off Loss</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Customer Return Justification Reason</label>
                <input
                  type="text"
                  placeholder="e.g., Damaged casing on delivery, Wrong size, Not as described"
                  value={rmaReason}
                  onChange={(e) => setRmaReason(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-indigo-650 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CornerDownLeft className="w-4 h-4" /> Issue RMA Stock Voucher
              </button>
            </form>

            {/* active RMAs reviews */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Logged RMA History</span>
              {salesOrders.filter(o => o.status === 'RMA_REQUESTED').length === 0 ? (
                <p className="text-xs text-slate-400">No active RMA dockets filed for this merchant slice.</p>
              ) : (
                <div id="rmas-list" className="space-y-2 text-xs">
                  {salesOrders.filter(o => o.status === 'RMA_REQUESTED').map(o => (
                    <div key={o.id} className="p-3.5 border border-red-150 bg-red-50/20 rounded-xl flex justify-between items-center bg-white">
                      <div>
                        <span className="font-bold text-slate-900 block">{o.id}</span>
                        <p className="text-slate-500 text-[11px] mt-0.5">Reason: <strong>{o.rmaReason}</strong></p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-white font-extrabold text-[9px] font-mono tracking-wider">
                        {o.rmaDisposition || 'RESTOCKED'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Carrier Quotes catalog tab */}
        {activeTab === 'carriers' && (
          <div className="space-y-5">
            <div className="bg-slate-50 border border-gray-200 p-4 rounded-xl space-y-3.5 text-xs text-slate-650">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Default Tenant Packaging Dimensions</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">Length (cm)</span>
                  <input type="number" value={cargoLength} onChange={(e) => setCargoLength(Number(e.target.value))} className="w-full p-1 border font-bold text-center bg-white rounded-lg" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">Width (cm)</span>
                  <input type="number" value={cargoWidth} onChange={(e) => setCargoWidth(Number(e.target.value))} className="w-full p-1 border font-bold text-center bg-white rounded-lg" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">Height (cm)</span>
                  <input type="number" value={cargoHeight} onChange={(e) => setCargoHeight(Number(e.target.value))} className="w-full p-1 border font-bold text-center bg-white rounded-lg" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">Gross Weight (kg)</span>
                  <input type="number" step="0.1" value={cargoWeight} onChange={(e) => setCargoWeight(Number(e.target.value))} className="w-full p-1 border font-bold text-center bg-white rounded-lg" />
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-slate-450 font-bold uppercase text-[9px] tracking-wider">
                    <th className="px-4 py-2">Courier Identity</th>
                    <th className="px-4 py-2">Service Type</th>
                    <th className="px-4 py-2 text-center">Fulfillment speed</th>
                    <th className="px-4 py-2 text-center">Trust Rating</th>
                    <th className="px-4 py-2 text-right">Negotiated Quote</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {activeQuotesList.map((quote) => (
                    <tr key={quote.carrier} className="hover:bg-slate-50 font-sans">
                      <td className="px-4 py-3 font-bold text-slate-800">{quote.carrier}</td>
                      <td className="px-4 py-3 text-slate-500 font-medium">{quote.serviceName}</td>
                      <td className="px-4 py-3 text-center font-bold text-indigo-700">{quote.days} {quote.days === 1 ? 'day' : 'days'}</td>
                      <td className="px-4 py-3 text-center text-teal-600 font-extrabold font-mono">{quote.rating}</td>
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-850 text-sm">${quote.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Right side inspector and stepper triggers */}
      <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 space-y-6">
        {selectedOrder ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest font-mono">Consignment Inspector</span>
                <h4 className="font-bold text-slate-905 text-[14px] font-mono">{selectedOrder.id}</h4>
              </div>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="text-xs uppercase font-extrabold text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                Close inspect
              </button>
            </div>

            {/* UNFULFILLED -> PICKING Console */}
            {selectedOrder.status === 'PICKING' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">1. Active Picking Scan</span>
                  <span className="px-2 py-0.5 bg-yellow-50 text-yellow-805 border border-yellow-250 font-bold text-[9px] rounded-full">Scans Verified</span>
                </div>

                <div className="bg-white border rounded-xl divide-y divide-gray-100 p-2 text-xs">
                  {selectedOrder.items.map(item => {
                    const picked = pickProgress[item.productId] ?? 0;
                    const done = picked >= item.quantityOrdered;

                    return (
                      <div key={item.productId} className="p-2.5 flex items-center justify-between gap-3 bg-white">
                        <div className="space-y-0.5">
                          <span className={`${done ? 'line-through text-slate-400' : 'font-bold text-slate-750'}`}>{item.productName}</span>
                          <span className="text-[9px] text-slate-400 font-mono block">SKU: {item.sku}</span>
                        </div>
                        <button
                          onClick={() => handlePickUnit(item)}
                          disabled={done}
                          className={`px-3 py-1 bg-slate-50 border rounded-xl font-bold flex items-center gap-1.5 transition ${
                            done ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'hover:bg-slate-100 text-indigo-650 cursor-pointer'
                          }`}
                        >
                          {done ? 'Checked' : `Scan (${picked}/${item.quantityOrdered})`}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => handleCompletePicking(selectedOrder)}
                  className="w-full py-2 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Verify Pick & Send to Packing
                </button>
              </div>
            )}

            {/* PACKING console selection */}
            {selectedOrder.status === 'PACKING' && (
              <div className="space-y-5">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">2. Packaging & Comparative Rate Shopping</span>

                {!isPackVerified ? (
                  <div className="bg-white border border-gray-205 rounded-xl p-4 space-y-4 text-xs text-slate-650">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block border-b pb-1">Container Dimensions</span>
                    <div className="grid grid-cols-2 gap-3 pb-1">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase">Length</span>
                        <input type="number" value={cargoLength} onChange={(e) => setCargoLength(Number(e.target.value))} className="w-full p-1 border font-bold text-center bg-white rounded-lg" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-400 font-extrabold">Width</span>
                        <input type="number" value={cargoWidth} onChange={(e) => setCargoWidth(Number(e.target.value))} className="w-full p-1 border font-bold text-center bg-white rounded-lg" />
                      </div>
                    </div>
                    <button
                      onClick={handlePackConfirm}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Calculate Quotes & Consolidate Box
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3.5 text-xs text-slate-650">
                      <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block border-b pb-1 flex items-center gap-1">
                        <Award className="w-4 h-4 text-indigo-500" /> Carrier Route Recommendations
                      </span>

                      <div className="space-y-2">
                        {activeQuotesList.slice(0, 3).map((quote, idx) => (
                          <div
                            key={quote.carrier}
                            onClick={() => setSelectedQuote(quote)}
                            className={`p-2.5 border rounded-xl cursor-pointer hover:bg-indigo-50/20 transition flex justify-between items-center text-xs ${
                              selectedQuote?.carrier === quote.carrier ? 'border-indigo-400 bg-indigo-50/10' : 'border-gray-200 bg-slate-50'
                            }`}
                          >
                            <div>
                              <span className="font-bold text-slate-800">{quote.carrier} • {quote.days} {quote.days === 1 ? 'day' : 'days'}</span>
                              <p className="text-[10px] text-slate-400 mt-0.5">{quote.serviceName}</p>
                            </div>
                            <span className="font-mono font-black text-slate-905 text-sm">${quote.cost.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleGenerateLabelAndShip(selectedOrder)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      Process Fulfillment & Print labels
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SHIPPED/DELIVERED Transit Stepper Console */}
            {(selectedOrder.status === 'SHIPPED' || selectedOrder.status === 'DELIVERED') && (
              <div className="space-y-5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">3. Live Shipment Transit Tracker</span>

                {/* Tracking metadata */}
                <div className="bg-white border rounded-xl p-3.5 text-xs space-y-2">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">Carrier Partner</span>
                    <span className="font-bold text-slate-805">{selectedOrder.carrierName}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">Consignment Number</span>
                    <span className="font-bold text-indigo-650 text-indigo-600">{selectedOrder.trackingNumber}</span>
                  </div>
                </div>

                {/* Progress stepper */}
                <div id="tracking-progress-stepper" className="space-y-4 pt-1">
                  <span className="text-[10px] font-bold uppercase text-slate-450 tracking-wider block">Real-time Transit Stepper Signals</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <button
                      onClick={() => handleSimulateTrackingTrip(selectedOrder, 'IN_TRANSIT')}
                      className={`py-1.5 rounded-lg border font-bold transition cursor-pointer text-center ${
                        selectedOrder.trackingStep === 'IN_TRANSIT' ? 'bg-indigo-600 text-white border-indigo-600 font-extrabold' : 'bg-white hover:bg-slate-50 text-slate-650'
                      }`}
                    >
                      Trigger En-Route
                    </button>
                    <button
                      onClick={() => handleSimulateTrackingTrip(selectedOrder, 'OUT_FOR_DELIVERY')}
                      className={`py-1.5 rounded-lg border font-bold transition cursor-pointer text-center ${
                        selectedOrder.trackingStep === 'OUT_FOR_DELIVERY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-50 text-slate-650'
                      }`}
                    >
                      Trigger Courier Out
                    </button>
                    <button
                      onClick={() => handleSimulateTrackingTrip(selectedOrder, 'DELIVERED')}
                      className={`py-1.5 rounded-lg border font-bold transition cursor-pointer text-center ${
                        selectedOrder.trackingStep === 'DELIVERED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white hover:bg-slate-50 text-slate-650'
                      }`}
                    >
                      Trigger Dropoff
                    </button>
                    <button
                      onClick={() => handleSimulateTrackingTrip(selectedOrder, 'EXCEPTION_HOLD')}
                      className={`py-1.5 rounded-lg border border-red-200 font-bold transition cursor-pointer text-center ${
                        selectedOrder.trackingStep === 'EXCEPTION_HOLD' ? 'bg-red-650 bg-red-600 text-white' : 'bg-white hover:bg-slate-50 text-red-500'
                      }`}
                    >
                      Trigger Customs Hold
                    </button>
                  </div>
                </div>

                {/* Tracking logs */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Consignment Audit Tracks</span>
                  <div className="bg-slate-950 text-slate-350 p-3 rounded-xl font-mono text-[9px] space-y-1.5 max-h-36 overflow-y-auto leading-relaxed uppercase">
                    {(selectedOrder.trackingLogs || []).map((log, idx) => (
                      <div key={idx} className="border-b border-slate-900 pb-1.5 last:border-0 last:pb-0">{log}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <Truck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-sm text-slate-700">Logistics Command Deck</p>
            <p className="text-xs text-slate-450 max-w-xs mx-auto">Select any active Sales Order from the picking backlog queue to initiate shipping and tracking operations.</p>
          </div>
        )}
      </div>

    </div>
  );
}
