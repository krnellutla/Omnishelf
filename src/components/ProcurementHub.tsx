import React, { useState, useEffect } from 'react';
import { ShoppingCart, FileText, CheckCircle2, ChevronRight, Truck, AlertCircle, Sparkles, Filter, ShieldAlert, DollarSign, Camera, Loader2, Upload, Check, AlertTriangle, FileWarning, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, PurchaseOrder, PurchaseOrderItem, UserRole } from '../types';

// Helper function to draw a mock invoice and convert to base64
export function generateMockInvoiceCanvas(preset: 'electronics' | 'furniture' | 'overbilled'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 600, 800);

  // Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 8;
  ctx.strokeRect(0, 0, 600, 800);

  // Top header style
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(4, 4, 592, 90);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('INVOICE / SUPPLY RECEIPT', 30, 52);

  // Subtitle
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px monospace';
  ctx.fillText('Logistics Ledger Verification Docket', 30, 75);

  // Logo Placeholder
  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.arc(520, 48, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('L', 515, 53);

  // Metadata boxes
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(30, 120, 240, 100);
  ctx.fillRect(330, 120, 240, 100);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 120, 240, 100);
  ctx.strokeRect(330, 120, 240, 100);

  // Metadata contents
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('SUPPLIER VENDOR:', 40, 140);
  ctx.fillText('BILLING TO:', 340, 140);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px sans-serif';
  
  let supplier = '';
  let invoiceRef = '';
  let itemsList: { name: string; sku: string; qty: number; cost: number }[] = [];
  
  if (preset === 'electronics') {
    supplier = 'Vertex Digital Ltd';
    invoiceRef = 'INV-VTX-7761';
    itemsList = [
      { name: 'Wireless Earbuds Pro', sku: 'ELE-EAR-001', qty: 20, cost: 45.00 },
      { name: 'USB-C Fast Charger (30W)', sku: 'ELE-CHG-005', qty: 30, cost: 6.80 }
    ];
  } else if (preset === 'furniture') {
    supplier = 'ComfortZone Furniture Corp';
    invoiceRef = 'INV-CFZ-4012';
    itemsList = [
      { name: 'Ergonomic Office Chair', sku: 'FUR-CHR-002', qty: 5, cost: 110.05 }
    ];
  } else {
    supplier = 'Vertex Digital Ltd';
    invoiceRef = 'INV-VTX-DISC';
    itemsList = [
      { name: 'Wireless Earbuds Pro', sku: 'ELE-EAR-001', qty: 25, cost: 65.00 }
    ];
  }

  ctx.fillText(supplier, 40, 162);
  ctx.fillText('Apex Retailers Warehouse', 340, 162);

  ctx.fillStyle = '#64748b';
  ctx.font = '11px sans-serif';
  ctx.fillText('Industrial Lane Gateway A', 40, 180);
  ctx.fillText('Changi Logistics District B', 40, 195);

  ctx.fillText('100 Pasir Panjang Rd, SG', 340, 180);
  ctx.fillText('Operator: sarah.c@logiledger.net', 340, 195);

  // Invoice numbers
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`Invoice No: ${invoiceRef}`, 30, 255);
  ctx.fillText(`Date: 2026-06-24`, 450, 255);

  // Divider
  ctx.beginPath();
  ctx.moveTo(30, 270);
  ctx.lineTo(570, 270);
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  // Table header
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(30, 290, 540, 30);
  
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('ITEM DESCRIPTION', 40, 310);
  ctx.fillText('SKU / CODE', 260, 310);
  ctx.fillText('QTY', 390, 310);
  ctx.fillText('UNIT COST', 440, 310);
  ctx.fillText('TOTAL (USD)', 510, 310);

  // Table body
  let currentY = 345;
  let subtotal = 0;

  itemsList.forEach((item) => {
    const itemTotal = item.qty * item.cost;
    subtotal += itemTotal;

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(item.name, 40, currentY);

    ctx.fillStyle = '#475569';
    ctx.font = '10px monospace';
    ctx.fillText(item.sku, 260, currentY);

    ctx.font = 'bold 11px monospace';
    ctx.fillText(item.qty.toString(), 390, currentY);
    ctx.fillText(`$${item.cost.toFixed(2)}`, 440, currentY);
    ctx.fillText(`$${itemTotal.toFixed(2)}`, 510, currentY);

    ctx.beginPath();
    ctx.moveTo(30, currentY + 15);
    ctx.lineTo(570, currentY + 15);
    ctx.strokeStyle = '#f1f5f9';
    ctx.stroke();

    currentY += 40;
  });

  currentY += 10;
  ctx.fillStyle = '#475569';
  ctx.font = '11px sans-serif';
  ctx.fillText('Subtotal Billed:', 380, currentY);
  ctx.font = '11px monospace';
  ctx.fillText(`$${subtotal.toFixed(2)}`, 510, currentY);

  currentY += 25;
  ctx.fillStyle = '#475569';
  ctx.font = '11px sans-serif';
  ctx.fillText('Freight & Carrier fee:', 380, currentY);
  ctx.font = '11px monospace';
  ctx.fillText('$0.00', 510, currentY);

  currentY += 25;
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('TOTAL AMOUNT DUE:', 380, currentY);
  
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`$${subtotal.toFixed(2)}`, 505, currentY);

  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 10px sans-serif';
  ctx.fillText('Terms: Net 30 days. Please reconcile with warehouse before issuing accounts payable.', 30, 710);
  ctx.fillText('Thank you for your business!', 30, 725);

  ctx.fillStyle = '#0f172a';
  const barcodeX = 350;
  const barcodeY = 705;
  for (let i = 0; i < 35; i++) {
    const width = (i % 3 === 0) ? 3 : ((i % 5 === 0) ? 1 : 2);
    ctx.fillRect(barcodeX + (i * 5), barcodeY, width, 25);
  }
  ctx.fillStyle = '#475569';
  ctx.font = '9px monospace';
  ctx.fillText(`*${invoiceRef}*`, barcodeX + 45, barcodeY + 37);

  ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
  ctx.lineWidth = 3;
  ctx.font = 'bold 45px sans-serif';
  ctx.strokeText('LOGILEDGER AUDITED', 80, 500);

  return canvas.toDataURL('image/png');
}

interface ProcurementHubProps {
  products: Product[];
  currentRole: UserRole;
  approvalLimit: number;
  onReceiveInventory: (productId: string, qty: number, reason: string) => void;
  purchaseOrders: PurchaseOrder[];
  onSavePurchaseOrder: (po: PurchaseOrder) => void;
}

export default function ProcurementHub({
  products,
  currentRole,
  approvalLimit,
  onReceiveInventory,
  purchaseOrders,
  onSavePurchaseOrder
}: ProcurementHubProps) {
  const [activeTab, setActiveTab] = useState<'pos' | 'reorder-rules' | 'ai-ocr'>('pos');
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [localAlert, setLocalAlert] = useState<{
    title: string;
    message: string;
    type: 'success' | 'warning' | 'info';
  } | null>(null);
  
  // States for receiving & invoice inputs
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState<string>('');
  const [supplierInvoiceAmt, setSupplierInvoiceAmt] = useState<number>(0);

  // --- AI OCR states ---
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<'electronics' | 'furniture' | 'overbilled' | null>('electronics');
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [ocrLoadingStep, setOcrLoadingStep] = useState<string>('');
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any | null>(null);

  useEffect(() => {
    if (selectedPreset) {
      const dataUrl = generateMockInvoiceCanvas(selectedPreset);
      setOcrImage(dataUrl);
      setOcrResult(null);
      setOcrError(null);
    }
  }, [selectedPreset]);

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedPreset(null);
    setOcrResult(null);
    setOcrError(null);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setOcrImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRunOcr = async (imageSrc: string) => {
    setOcrLoading(true);
    setOcrError(null);
    setOcrResult(null);
    setOcrLoadingStep("Ingesting image buffer...");
    
    try {
      const steps = [
        "Initializing secure gateway to Gemini...",
        "Sending invoice payload to Gemini-3.5-flash multimodal OCR...",
        "Extracting invoice coordinates and supplier identity...",
        "Extracting items ledger table...",
        "Cross-referencing SKU catalog in database...",
        "Fuzzy-matching names to existing products...",
        "Verifying prices and calculations..."
      ];
      
      let currentStepIdx = 0;
      const interval = setInterval(() => {
        if (currentStepIdx < steps.length - 1) {
          currentStepIdx++;
          setOcrLoadingStep(steps[currentStepIdx]);
        }
      }, 1200);

      const response = await fetch('/api/ocr-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: imageSrc,
          products: products.map(p => ({ id: p.id, name: p.name, sku: p.sku, cost: p.cost }))
        })
      });

      clearInterval(interval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to scan invoice image via Gemini API.");
      }

      const data = await response.json();
      setOcrResult(data);
      
    } catch (err: any) {
      console.error(err);
      setOcrError(err.message || "An unexpected error occurred during OCR scanning.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleRunOcrInInspect = async (imageSrc: string, activePo: PurchaseOrder) => {
    setOcrLoading(true);
    setOcrError(null);
    setOcrLoadingStep("Processing image buffer...");

    try {
      const steps = [
        "Interfacing with Gemini-3.5-flash...",
        "Extracting invoice totals & ref...",
        "Mapping quantities to PO lines..."
      ];
      let currentIdx = 0;
      const interval = setInterval(() => {
        if (currentIdx < steps.length - 1) {
          currentIdx++;
          setOcrLoadingStep(steps[currentIdx]);
        }
      }, 1000);

      const response = await fetch('/api/ocr-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageSrc,
          products: products.map(p => ({ id: p.id, name: p.name, sku: p.sku, cost: p.cost }))
        })
      });

      clearInterval(interval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "OCR failed.");
      }

      const data = await response.json();
      
      if (data.invoiceRef) {
        setSupplierInvoiceRef(data.invoiceRef);
      }
      if (data.invoiceAmount !== undefined) {
        setSupplierInvoiceAmt(data.invoiceAmount);
      }

      const newRecd: Record<string, number> = { ...receivedQtys };
      activePo.items.forEach(poItem => {
        const extractedItem = data.items?.find((ocrItem: any) => 
          ocrItem.productId === poItem.productId || 
          ocrItem.sku === poItem.sku || 
          ocrItem.productName?.toLowerCase() === poItem.productName?.toLowerCase()
        );
        if (extractedItem) {
          newRecd[poItem.productId] = extractedItem.quantity;
        }
      });
      setReceivedQtys(newRecd);

      setLocalAlert({
        title: "AI Auto-Fill Completed",
        message: `Extracted Invoice Ref: ${data.invoiceRef || 'N/A'}\nExtracted Amount: $${data.invoiceAmount?.toFixed(2) || 'N/A'}\n\nReview the pre-filled fields below before completing the Match Check.`,
        type: "success"
      });

    } catch (err: any) {
      setOcrError(err.message || "Failed to parse invoice.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleCreatePOFromOcr = () => {
    if (!ocrResult) return;

    const items: PurchaseOrderItem[] = ocrResult.items.map((it: any) => {
      let matchedProduct = products.find(p => p.id === it.productId || p.sku === it.sku || p.name.toLowerCase() === it.productName.toLowerCase());
      
      return {
        productId: matchedProduct?.id || `prod-ocr-${Math.floor(100000 + Math.random() * 900000)}`,
        productName: matchedProduct?.name || it.productName,
        sku: matchedProduct?.sku || it.sku || `SKU-OCR-${Math.floor(1000 + Math.random() * 9000)}`,
        quantityOrdered: it.quantity,
        quantityReceived: 0,
        unitCost: it.unitCost
      };
    });

    const totalValue = items.reduce((sum, item) => sum + (item.quantityOrdered * item.unitCost), 0);
    const requiresApproval = totalValue > approvalLimit;

    const newPo: PurchaseOrder = {
      id: `PO-OCR-${Math.floor(100000 + Math.random() * 900000)}`,
      tenantId: products[0]?.tenantId || 'tenant-apex',
      supplierName: ocrResult.supplierName || 'Unknown Supplier',
      status: 'DRAFT',
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvalRequired: requiresApproval,
      isApproved: !requiresApproval
    };

    onSavePurchaseOrder(newPo);
    setSelectedPoId(newPo.id);
    setActiveTab('pos');
    setOcrResult(null);
    setOcrImage(null);
  };

  // Filter low stock item details to help draft new orders
  const lowStockProducts = products.filter(p => p.quantity <= p.minStock);

  // Group low stock products by supplier for drafting
  const suppliers = Array.from(new Set(products.map(p => p.supplier))).filter(Boolean);

  const handleGenerateAutoDrafts = () => {
    if (lowStockProducts.length === 0) return;
    
    // Group low stock products by supplier
    const grouped: Record<string, Product[]> = {};
    lowStockProducts.forEach(p => {
      if (!grouped[p.supplier]) grouped[p.supplier] = [];
      grouped[p.supplier].push(p);
    });

    Object.keys(grouped).forEach(supplier => {
      const prods = grouped[supplier];
      // Create PO items ordering up to 3x safety stock
      const items: PurchaseOrderItem[] = prods.map(p => {
        const orderQty = Math.max(10, (p.minStock * 2) - p.quantity);
        return {
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          quantityOrdered: orderQty,
          quantityReceived: 0,
          unitCost: p.cost
        };
      });

      const totalValue = items.reduce((sum, item) => sum + (item.quantityOrdered * item.unitCost), 0);
      const requiresApproval = totalValue > approvalLimit;

      const newPo: PurchaseOrder = {
        id: `PO-${Math.floor(100000 + Math.random() * 900000)}`,
        tenantId: products[0]?.tenantId || 'tenant-apex',
        supplierName: supplier,
        status: 'DRAFT',
        items,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        approvalRequired: requiresApproval,
        isApproved: !requiresApproval
      };

      onSavePurchaseOrder(newPo);
    });
  };

  const handleCreateManualPO = (supplier: string) => {
    const supplierProducts = products.filter(p => p.supplier === supplier);
    if (supplierProducts.length === 0) return;

    // Ordered 10 units each
    const items: PurchaseOrderItem[] = supplierProducts.slice(0, 2).map(p => ({
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      quantityOrdered: 15,
      quantityReceived: 0,
      unitCost: p.cost
    }));

    const totalValue = items.reduce((sum, item) => sum + (item.quantityOrdered * item.unitCost), 0);
    const requiresApproval = totalValue > approvalLimit;

    const newPo: PurchaseOrder = {
      id: `PO-${Math.floor(100000 + Math.random() * 900000)}`,
      tenantId: products[0]?.tenantId || 'tenant-apex',
      supplierName: supplier,
      status: 'DRAFT',
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvalRequired: requiresApproval,
      isApproved: !requiresApproval
    };

    onSavePurchaseOrder(newPo);
    setSelectedPoId(newPo.id);
  };

  const handleApprovePO = (po: PurchaseOrder) => {
    if (currentRole !== 'Operations Director') {
      setLocalAlert({
        title: "Permission Lockdown",
        message: "Only active Operations Directors can override and authorize procurement budgets.",
        type: "warning"
      });
      return;
    }
    const updated = {
      ...po,
      isApproved: true,
      approvedBy: 'Operations Director',
      status: 'SENT' as const,
      updatedAt: new Date().toISOString()
    };
    onSavePurchaseOrder(updated);
  };

  const handleSendPO = (po: PurchaseOrder) => {
    const updated = {
      ...po,
      status: 'SENT' as const,
      updatedAt: new Date().toISOString()
    };
    onSavePurchaseOrder(updated);
  };

  const handleInitiateReceive = (po: PurchaseOrder) => {
    const initialRecs: Record<string, number> = {};
    po.items.forEach(item => {
      initialRecs[item.productId] = item.quantityOrdered; // default filled expecting full match
    });
    setReceivedQtys(initialRecs);
    setSupplierInvoiceAmt(po.items.reduce((sum, it) => sum + (it.quantityOrdered * it.unitCost), 0));
    setSupplierInvoiceRef(`INV-${po.id.split('-')[1]}`);
  };

  const handleCompleteThreeWayMatch = (po: PurchaseOrder) => {
    // Audit received quantities vs invoice
    const updatedItems = po.items.map(item => {
      const recAmt = receivedQtys[item.productId] ?? 0;
      return {
        ...item,
        quantityReceived: recAmt
      };
    });

    const expectedTotal = updatedItems.reduce((sum, item) => sum + (item.quantityOrdered * item.unitCost), 0);
    const receivedOriginalCost = updatedItems.reduce((sum, item) => sum + (item.quantityReceived * item.unitCost), 0);
    
    // Check match conditions
    let matchResult: 'MATCHED' | 'DISCREPANCY' = 'MATCHED';
    let details = 'Reconciled 3-way check successfully.';

    if (supplierInvoiceAmt !== receivedOriginalCost) {
      matchResult = 'DISCREPANCY';
      details = `Billing cost mismatch! Received cost: $${receivedOriginalCost.toFixed(2)} vs Supplier billed invoice: $${supplierInvoiceAmt.toFixed(2)}`;
    }

    const hasQuantityShortfall = updatedItems.some(it => it.quantityReceived < it.quantityOrdered);
    const hasQuantityOverage = updatedItems.some(it => it.quantityReceived > it.quantityOrdered);

    if (hasQuantityShortfall) {
      matchResult = 'DISCREPANCY';
      details += ` Shortfall discrepancy: quantity received is lower than purchased orders.`;
    } else if (hasQuantityOverage) {
      matchResult = 'DISCREPANCY';
      details += ` Overage warning: surplus items received from shipper docket.`;
    }

    // Update PO details
    const finalPoStatus = updatedItems.every(it => it.quantityReceived >= it.quantityOrdered) ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

    const updatedPo: PurchaseOrder = {
      ...po,
      status: finalPoStatus as any,
      items: updatedItems,
      invoiceAmount: supplierInvoiceAmt,
      threeWayMatchResult: matchResult,
      discrepancyDetails: details,
      updatedAt: new Date().toISOString()
    };

    onSavePurchaseOrder(updatedPo);

    // Apply inventory additions to parent data stack
    updatedItems.forEach(item => {
      if (item.quantityReceived > 0) {
        onReceiveInventory(
          item.productId, 
          item.quantityReceived, 
          `Received PO delivery (${po.id}) from supplier ${po.supplierName}. 3-Way Match Audit state: ${matchResult}.`
        );
      }
    });

    setSelectedPoId(null);
  };

  const selectedPo = purchaseOrders.find(po => po.id === selectedPoId);

  return (
    <div id="procurement-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* Left side PO List Panel */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-5">
          <div>
            <h3 className="font-bold text-gray-950 text-base flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-650 text-indigo-600" /> Procurement Ledger & PO Control
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Issue replenishment requests, approve procurement budgets, and process 3-Way cost matches.
            </p>
          </div>
          
          <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5 text-xs font-bold shrink-0 self-start">
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'pos' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Purchase Orders
            </button>
            <button
              onClick={() => setActiveTab('reorder-rules')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'reorder-rules' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Stock Reorder Planner
            </button>
            <button
              onClick={() => setActiveTab('ai-ocr')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'ai-ocr' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'} flex items-center gap-1`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> AI Invoice OCR
            </button>
          </div>
        </div>

        {activeTab === 'pos' && (
          <div className="space-y-4">
            {purchaseOrders.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl space-y-3">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="text-gray-900 font-bold text-sm">No Active Purchase Orders</p>
                  <p className="text-xs text-slate-500">Go to Reorder Planner to auto-generate PO matrices for low stock suppliers.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {purchaseOrders.map((po) => {
                  const poTotal = po.items.reduce((sum, item) => sum + (item.quantityOrdered * item.unitCost), 0);
                  const isPendingOpsApproval = po.approvalRequired && !po.isApproved;

                  return (
                    <div
                      key={po.id}
                      onClick={() => { setSelectedPoId(po.id); if (po.status === 'SENT') handleInitiateReceive(po); }}
                      className={`p-4 border rounded-2xl cursor-pointer hover:shadow-xs transition duration-150 flex flex-col sm:flex-row justify-between sm:items-center gap-3 relative ${
                        selectedPoId === po.id ? 'border-indigo-500 bg-indigo-50/20' : 'border-gray-200 bg-white hover:border-gray-250'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs tracking-tight font-mono">{po.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide ${
                            po.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' :
                            po.status === 'SENT' ? 'bg-blue-50 text-blue-700 border border-blue-150' :
                            po.status === 'PARTIALLY_RECEIVED' ? 'bg-orange-50 text-orange-700 border border-orange-150' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-150'
                          }`}>
                            {po.status}
                          </span>
                          {isPendingOpsApproval && (
                            <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[9px] font-black border border-red-200 flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" /> PENDING SG SIGN-OFF
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          Supplier: <span className="font-semibold text-slate-800">{po.supplierName}</span> • Items: {po.items.length}
                        </div>
                        <p className="text-[10px] text-slate-400">Created: {new Date(po.createdAt).toLocaleDateString()}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Estimated Total</span>
                          <span className="text-sm font-black text-slate-900 font-mono">${poTotal.toFixed(2)}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reorder-rules' && (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-3 items-start text-xs text-indigo-900">
                <Sparkles className="w-5 h-5 text-indigo-650 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-gray-950">Intelligent Vendor Consolidator</span>
                  <p className="text-indigo-800 leading-relaxed">
                    We located <span className="font-bold text-slate-900">{lowStockProducts.length} items</span> under stock safety levels. We can instantly group them by suppliers and draft preloaded Purchase Orders.
                  </p>
                </div>
              </div>
              <button
                onClick={handleGenerateAutoDrafts}
                disabled={lowStockProducts.length === 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition whitespace-nowrap self-stretch sm:self-auto flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3.5 h-3.5" /> Generate Draft POs
              </button>
            </div>

            {/* Quick Vendor draft list */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest">Select Supplier to Draft Manual Order</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suppliers.map(sup => (
                  <div key={sup} className="p-4 border border-gray-200 rounded-2xl hover:border-gray-250 hover:bg-slate-50 transition flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800 text-sm">{sup}</span>
                      <p className="text-slate-400 mt-1 text-[11px]">
                        Active catalog SKUs: {products.filter(p => p.supplier === sup).length}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCreateManualPO(sup)}
                      className="px-3 py-1.5 border border-indigo-200 text-indigo-650 hover:bg-indigo-50 rounded-xl font-bold font-sans cursor-pointer transition"
                    >
                      Draft Order
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai-ocr' && (
          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Gemini AI OCR Supply Invoice Ingestion</h4>
                  <p className="text-[11px] text-slate-400">Powered by Gemini-3.5-flash Multimodal Vision Engine</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Ingest supplier paper dockets, receipts, and digital invoices instantly. This module uses Gemini AI to analyze billing statements, extract product lists, and fuzzy-match them to your catalog before instantiating purchase orders.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Image Selection & Preview */}
              <div className="space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">1. Select or Upload Invoice Image</span>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedPreset('electronics')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      selectedPreset === 'electronics'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-bold shadow-xs'
                        : 'border-gray-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-[10px] block font-extrabold text-indigo-600 font-mono">PRESET A</span>
                    <span className="text-[11px] block mt-0.5 truncate font-bold">Vertex Digital</span>
                    <span className="text-[9px] text-slate-400 block font-mono font-sans">2 catalog items</span>
                  </button>

                  <button
                    onClick={() => setSelectedPreset('furniture')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      selectedPreset === 'furniture'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-bold shadow-xs'
                        : 'border-gray-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-[10px] block font-extrabold text-indigo-600 font-mono">PRESET B</span>
                    <span className="text-[11px] block mt-0.5 truncate font-bold font-sans">ComfortZone Sofa</span>
                    <span className="text-[9px] text-slate-400 block font-mono font-sans">1 catalog item</span>
                  </button>

                  <button
                    onClick={() => setSelectedPreset('overbilled')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      selectedPreset === 'overbilled'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-bold shadow-xs'
                        : 'border-gray-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-[10px] block font-extrabold text-red-500 font-mono">PRESET C</span>
                    <span className="text-[11px] block mt-0.5 truncate font-bold font-sans">Variance Demo</span>
                    <span className="text-[9px] text-red-500/75 block font-mono font-sans">Cost anomaly demo</span>
                  </button>
                </div>

                <div className="border border-dashed border-gray-300 rounded-2xl p-4 bg-slate-50 flex flex-col items-center justify-center text-center relative hover:bg-slate-100/50 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-700 font-sans">Drag or Upload Custom Invoice</span>
                  <span className="text-[10px] text-slate-400 mt-1 font-sans">Supports JPEG, PNG up to 10MB</span>
                </div>

                {ocrImage && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Image Preview buffer</span>
                      {selectedPreset && (
                        <span className="text-[9px] px-2 py-0.5 bg-indigo-100 text-indigo-700 font-bold rounded-full uppercase tracking-wider font-mono">Dynamically Rendered</span>
                      )}
                    </div>
                    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-slate-100 p-2 max-h-[320px] overflow-y-auto">
                      <img src={ocrImage} alt="Invoice preview" className="w-full h-auto rounded-lg shadow-sm" />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Ingestion Status & Extracted details */}
              <div className="p-5 bg-white border border-gray-200 rounded-2xl space-y-4 flex flex-col justify-between min-h-[400px]">
                <div className="space-y-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono font-sans">2. Extraction & Ingestion</span>

                  {/* Empty state */}
                  {!ocrLoading && !ocrResult && !ocrError && (
                    <div className="text-center py-16 space-y-3">
                      <Camera className="w-10 h-10 text-slate-300 mx-auto" />
                      <div>
                        <p className="text-xs font-bold text-slate-700 font-sans">Ready to Scan</p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto font-sans">Click the button below to stream this invoice image buffer to Gemini OCR models.</p>
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {ocrLoading && (
                    <div className="text-center py-16 space-y-4">
                      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-800 animate-pulse font-sans">Running Gemini Image OCR...</p>
                        <p className="text-[10px] text-indigo-600 font-mono font-medium max-w-[245px] mx-auto bg-indigo-50 px-2 py-1 rounded border border-indigo-100">{ocrLoadingStep}</p>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {ocrError && (
                    <div className="p-4 bg-red-50 border border-red-150 rounded-2xl text-red-850 text-xs space-y-2">
                      <span className="font-bold flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-red-600" /> Scanning Interrupted</span>
                      <p className="leading-relaxed text-[11px] font-sans">{ocrError}</p>
                      <p className="text-[10px] text-red-600 font-sans">Please make sure your GEMINI_API_KEY is properly set up inside the Secrets drawer.</p>
                    </div>
                  )}

                  {/* Success Results State */}
                  {ocrResult && (
                    <div className="space-y-4 font-sans">
                      <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Gemini OCR successfully extracted details!</span>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-2 font-sans">
                        <div className="flex justify-between border-b border-slate-200 pb-1.5">
                          <span className="text-slate-450">Extracted Supplier Vendor:</span>
                          <span className="font-bold text-slate-800 font-sans">{ocrResult.supplierName}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-1.5 font-sans">
                          <span className="text-slate-450 font-sans">Invoice Reference:</span>
                          <span className="font-bold font-mono text-slate-800">{ocrResult.invoiceRef || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between font-sans">
                          <span className="text-slate-450 font-sans">Total Billed Amt:</span>
                          <span className="font-bold font-mono text-indigo-650">${ocrResult.invoiceAmount?.toFixed(2) || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Matched Line Items</span>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {ocrResult.items?.map((item: any, idx: number) => {
                            const isNewItem = item.productId === 'temp-new' || !products.some(p => p.id === item.productId);
                            return (
                              <div key={idx} className="p-2 border border-slate-200 rounded-lg flex items-center justify-between text-xs bg-slate-50/50">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 font-sans">
                                    <span className="font-bold text-slate-800 truncate max-w-[150px] font-sans">{item.productName}</span>
                                    {isNewItem ? (
                                      <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 text-[8px] font-bold rounded font-mono">NEW ITEM</span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-bold rounded font-mono">MATCHED</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono block">SKU: {item.sku} • Qty {item.quantity}</span>
                                </div>
                                <div className="text-right font-mono font-bold text-slate-700">
                                  ${(item.quantity * item.unitCost).toFixed(2)}
                                  <span className="text-[9px] text-slate-400 block font-normal font-sans">@ ${item.unitCost.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div className="pt-4 border-t border-slate-100 flex gap-2.5 font-sans">
                  {!ocrResult ? (
                    <button
                      onClick={() => ocrImage && handleRunOcr(ocrImage)}
                      disabled={ocrLoading || !ocrImage}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-4 h-4" /> Run AI OCR Scan
                    </button>
                  ) : (
                    <div className="flex gap-2 w-full font-sans">
                      <button
                        onClick={() => { setOcrResult(null); if (selectedPreset) setSelectedPreset(selectedPreset); }}
                        className="px-3 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition cursor-pointer"
                      >
                        Reset
                      </button>
                      <button
                        onClick={handleCreatePOFromOcr}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> Confirm & Ingest Draft PO
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right side inspect / workflow action panel */}
      <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 space-y-6">
        {selectedPo ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest font-mono">Process Docket</span>
                <h4 className="font-bold text-slate-900 text-[14px] font-mono">{selectedPo.id}</h4>
              </div>
              <button
                onClick={() => setSelectedPoId(null)}
                className="text-xs text-slate-450 hover:text-slate-700 font-bold transition uppercase cursor-pointer"
              >
                Close inspect
              </button>
            </div>

            {/* Supplier / Status metadata */}
            <div className="bg-white border border-gray-200 rounded-xl p-3.5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-450 text-slate-400">Supplier Enterprise</span>
                <span className="font-bold text-slate-800 text-right">{selectedPo.supplierName}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <span className="text-slate-400">Authority Consent</span>
                {selectedPo.approvalRequired ? (
                  selectedPo.isApproved ? (
                    <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved by {selectedPo.approvedBy}
                    </span>
                  ) : (
                    <span className="text-red-700 font-extrabold flex items-center gap-1 uppercase text-[10px]">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Restrict Hold ({currentRole})
                    </span>
                  )
                ) : (
                  <span className="text-emerald-700 font-bold">Standard Approved (Under Limit)</span>
                )}
              </div>
            </div>

            {/* Stage triggers */}
            <div className="space-y-4">
              {selectedPo.status === 'DRAFT' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Authorization Pipeline</span>
                  {selectedPo.approvalRequired && !selectedPo.isApproved ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-red-50 text-red-800 border border-red-150 rounded-xl text-xs space-y-1.5">
                        <span className="font-bold flex items-center gap-1">
                          <ShieldAlert className="w-4 h-4 shrink-0" /> Procurement Limit Exceeded
                        </span>
                        <p className="text-red-700 leading-relaxed text-[11px]">
                          This PO exceeds the tenant's single-docket approval budget limit of <strong>${approvalLimit}</strong>. Please switch role to <strong>Operations Director</strong> in the identity panel to sign off.
                        </p>
                      </div>
                      <button
                        onClick={() => handleApprovePO(selectedPo)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Sign off & Send PO
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSendPO(selectedPo)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-705 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Truck className="w-4 h-4" /> Send Purchase Order
                    </button>
                  )}
                </div>
              )}

              {/* SENT status: Warehouse physical verification & match audits */}
              {(selectedPo.status === 'SENT' || selectedPo.status === 'PARTIALLY_RECEIVED') && (
                <div className="space-y-5">
                  {/* AI OCR Smart Auto-Fill Assistant */}
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center gap-1.5 text-indigo-950 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>AI OCR Auto-Fill Assistant</span>
                    </div>
                    <p className="text-[11px] text-indigo-900 leading-normal">
                      Scan supplier invoice to automatically extract and pre-fill receipt quantities, invoice references, and matching amounts instantly.
                    </p>
                    
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                        <button
                          onClick={async () => {
                            const presetType = selectedPo.id === 'PO-881293' ? 'electronics' : (selectedPo.supplierName.includes('Furniture') ? 'furniture' : 'overbilled');
                            const base64 = generateMockInvoiceCanvas(presetType);
                            await handleRunOcrInInspect(base64, selectedPo);
                          }}
                          disabled={ocrLoading}
                          className="px-2.5 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-100/50 text-indigo-700 rounded-lg font-sans transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {ocrLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          Scan Mock Invoice
                        </button>
                        
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                await handleRunOcrInInspect(reader.result as string, selectedPo);
                              };
                              reader.readAsDataURL(file);
                            }}
                            disabled={ocrLoading}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <button
                            disabled={ocrLoading}
                            className="w-full px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center justify-center gap-1 cursor-pointer font-sans"
                          >
                            <Upload className="w-3 h-3" /> Custom Image
                          </button>
                        </div>
                      </div>

                      {ocrLoading && (
                        <div className="text-center p-2 bg-indigo-100/50 rounded-lg text-[10px] text-indigo-950 font-mono animate-pulse font-bold">
                          {ocrLoadingStep}
                        </div>
                      )}
                      
                      {ocrError && (
                        <div className="p-2 bg-red-50 text-red-700 text-[10px] rounded-lg font-bold font-sans">
                          {ocrError}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">1. Confirm Shipped Quantities</span>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 text-xs">
                      {selectedPo.items.map(item => (
                        <div key={item.productId} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2.5 last:border-0 last:pb-0">
                          <div>
                            <span className="font-bold text-slate-800 text-[11px] block">{item.productName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Ordered: {item.quantityOrdered} units</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] font-bold text-slate-400">Recd:</label>
                            <input
                              type="number"
                              min="0"
                              value={receivedQtys[item.productId] ?? ''}
                              onChange={(e) => setReceivedQtys({
                                ...receivedQtys,
                                [item.productId]: Number(e.target.value)
                              })}
                              className="w-16 px-1.5 py-1 text-center bg-slate-50 border border-gray-200 rounded-lg text-slate-800 font-bold text-xs focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">2. Supplier Bill Cost Check (3-Way)</span>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3.5 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Vendor Reference Invoice #</label>
                        <input
                          type="text"
                          value={supplierInvoiceRef}
                          onChange={(e) => setSupplierInvoiceRef(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-slate-850 font-semibold focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex justify-between">
                          <span>Invoice Billed Amount (USD)</span>
                          <span className="text-[9px] font-black text-indigo-500">PO default: ${(selectedPo.items.reduce((sum, item) => sum + (item.quantityOrdered * item.unitCost), 0)).toFixed(2)}</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={supplierInvoiceAmt}
                            onChange={(e) => setSupplierInvoiceAmt(Number(e.target.value))}
                            className="w-full pl-6 pr-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-slate-850 font-mono font-bold focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCompleteThreeWayMatch(selectedPo)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    Run Match Check & Intake Stock
                  </button>
                </div>
              )}

              {/* RECEIVED status panel with matched findings */}
              {(selectedPo.status === 'RECEIVED' || selectedPo.status === 'PARTIALLY_RECEIVED') && selectedPo.threeWayMatchResult && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">3-Way Compliance Auditor Results</span>
                  
                  <div className={`p-4 border rounded-2xl text-xs space-y-2 leading-relaxed ${
                    selectedPo.threeWayMatchResult === 'MATCHED'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  }`}>
                    <span className="font-extrabold flex items-center gap-1">
                      {selectedPo.threeWayMatchResult === 'MATCHED' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-yellow-600" />}
                      3-WAY AUDIT RESULT: {selectedPo.threeWayMatchResult}
                    </span>
                    <p className="text-[11px] font-bold">{selectedPo.discrepancyDetails}</p>
                    <div className="border-t border-dotted border-current/20 pt-2 text-[10px] font-mono grid grid-cols-2 gap-1.5">
                      <div>Invoice Billed: ${selectedPo.invoiceAmount?.toFixed(2)}</div>
                      <div>Dossier Reference: {supplierInvoiceRef || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Item Breakdown details summary list */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ordered Inventory Items</span>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden font-mono text-[10px] max-h-48 overflow-y-auto">
                {selectedPo.items.map(item => (
                  <div key={item.productId} className="p-2.5 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div>
                      <span className="font-bold text-slate-800 block">{item.productName}</span>
                      <span className="text-slate-400">SKU: {item.sku}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800 block">Qty {item.quantityOrdered}</span>
                      <span className="text-slate-400">@ ${item.unitCost.toFixed(2)} ea</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 space-y-2">
            <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-sm text-slate-700">Audit Dossier Inspector</p>
            <p className="text-xs text-slate-450 text-slate-400 max-w-xs mx-auto">Select any Purchase Order from the ledger to authorization sign-off or execute receipts.</p>
          </div>
        )}
      </div>

      {/* State-based Custom Animated Alert Dialog */}
      <AnimatePresence>
        {localAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLocalAlert(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 z-10 space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${
                  localAlert.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : localAlert.type === 'warning' 
                      ? 'bg-amber-50 text-amber-600' 
                      : 'bg-blue-50 text-blue-600'
                }`}>
                  {localAlert.type === 'success' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : localAlert.type === 'warning' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <ShoppingCart className="w-6 h-6" />
                  )}
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h4 className="text-base font-bold text-slate-900 leading-snug">{localAlert.title}</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed font-sans">{localAlert.message}</p>
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => setLocalAlert(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
