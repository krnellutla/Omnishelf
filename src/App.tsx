/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Barcode,
  RefreshCw,
  Wifi,
  WifiOff,
  CloudLightning,
  Smartphone,
  Monitor,
  CheckCircle2,
  Trash2,
  ChevronRight,
  TrendingDown,
  Warehouse,
  Printer,
  ChevronDown,
  Activity,
  User,
  ExternalLink,
  Lock,
  ShoppingCart,
  ClipboardCheck,
  Truck,
  BarChart3,
  Sparkles,
  Cpu,
  Sun,
  Moon,
  Bell,
  AlertTriangle,
  X,
  BellRing,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Firebase & Auth Integrations
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, query, where, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, googleProvider, signInWithPopup, signOut, OperationType, handleFirestoreError } from './utils/firebase';

// Models & API Types
import { Product, Category, Transaction, SyncState, UserRole, PurchaseOrder, CycleCountSession, SalesOrder, WebhookLog, StockAlert } from './types';
import {
  getLocalProducts,
  saveLocalProduct,
  deleteLocalProduct,
  getLocalTransactions,
  createLocalTransaction,
  getLocalCategories,
  saveLocalCategory,
  getPendingSyncCount,
  clearPendingSync,
  getLastSyncedTime
} from './utils/localDB';

// Extracted Sub-Components
import BarcodeScanner from './components/BarcodeScanner';
import ProductForm from './components/ProductForm';
import InventoryStats from './components/InventoryStats';
import TransactionsHistory from './components/TransactionsHistory';
import DirectorySSOHub from './components/DirectorySSOHub';
import ProcurementHub from './components/ProcurementHub';
import CycleCountHub from './components/CycleCountHub';
import FulfillmentHub from './components/FulfillmentHub';
import AnalyticsHub from './components/AnalyticsHub';
import CopilotHub from './components/CopilotHub';
import ProductLandingSite from './components/ProductLandingSite';
import OnboardingWizard from './components/OnboardingWizard';

interface Tenant {
  id: string;
  name: string;
  logoColor: string;
  badgeColor: string;
  description: string;
  primarySupplier: string;
}

const TENANTS: Tenant[] = [
  {
    id: 'tenant-apex',
    name: 'Apex Retailers',
    logoColor: 'text-indigo-600',
    badgeColor: 'bg-indigo-150 text-indigo-800 border-indigo-200',
    description: 'High-volume Consumer Electronics and Sports Gear distributor.',
    primarySupplier: 'Vertex Digital Ltd'
  },
  {
    id: 'tenant-nova',
    name: 'Nova Lifestyle Goods',
    logoColor: 'text-pink-600',
    badgeColor: 'bg-pink-150 text-pink-800 border-pink-200',
    description: 'Boutique Apparel, Contemporary Furniture, and Home Decor.',
    primarySupplier: 'EcoThread Apparel Co'
  },
  {
    id: 'tenant-greensprout',
    name: 'GreenSprout Grocery',
    logoColor: 'text-emerald-600',
    badgeColor: 'bg-emerald-150 text-emerald-850 border-emerald-200',
    description: 'Eco-certified coffee imports, organic foods, and daily beverages.',
    primarySupplier: 'Andes Direct Importers'
  }
];

const DEFAULT_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-881293',
    tenantId: 'tenant-apex',
    supplierName: 'Vertex Digital Ltd',
    status: 'SENT',
    items: [
      { productId: 'prod-001', productName: 'Wireless Earbuds Pro', sku: 'ELE-EAR-001', quantityOrdered: 20, quantityReceived: 0, unitCost: 45.00 }
    ],
    createdAt: new Date(Date.now() - 3 * 3600 * 1000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 3600 * 1000 * 24).toISOString(),
    approvalRequired: false,
    isApproved: true
  },
  {
    id: 'PO-991204',
    tenantId: 'tenant-apex',
    supplierName: 'Vertex Digital Ltd',
    status: 'RECEIVED',
    items: [
      { productId: 'prod-005', productName: 'USB-C Fast Charger (30W)', sku: 'ELE-CHG-005', quantityOrdered: 50, quantityReceived: 50, unitCost: 6.80 }
    ],
    createdAt: new Date(Date.now() - 10 * 3600 * 1000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 3600 * 1000 * 24).toISOString(),
    invoiceAmount: 340.00,
    threeWayMatchResult: 'MATCHED',
    discrepancyDetails: 'Reconciled 3-way check successfully.',
    approvalRequired: false,
    isApproved: true
  },
  {
    id: 'PO-440283',
    tenantId: 'tenant-nova',
    supplierName: 'ComfortZone Furniture Corp',
    status: 'DRAFT',
    items: [
      { productId: 'prod-002', productName: 'Ergonomic Office Chair', sku: 'FUR-CHR-002', quantityOrdered: 12, quantityReceived: 0, unitCost: 110.05 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvalRequired: true,
    isApproved: false
  }
];

const DEFAULT_CYCLE_COUNTS: CycleCountSession[] = [
  {
    id: 'CNT-901844',
    tenantId: 'tenant-apex',
    name: 'Class [A] Safety Cycle Audit',
    status: 'RECONCILED',
    items: [
      { productId: 'prod-001', productName: 'Wireless Earbuds Pro', sku: 'ELE-EAR-001', expectedQuantity: 14, actualQuantity: 14, variance: 0, reasonCode: 'Match' }
    ],
    createdAt: new Date(Date.now() - 5 * 3600 * 1000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 3600 * 1000 * 24).toISOString(),
    operatorUserId: 'Sarah Connor',
    approvedBy: 'Operations Director'
  },
  {
    id: 'CNT-108422',
    tenantId: 'tenant-greensprout',
    name: 'Class [B] Spot Discrepancy Count',
    status: 'PENDING_APPROVAL',
    items: [
      { productId: 'prod-004', productName: 'Organic Coffee Beans (1kg)', sku: 'GRO-COF-004', expectedQuantity: 9, actualQuantity: 7, variance: -2, reasonCode: 'Water Damage / Spoilage' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    operatorUserId: 'Sarah Connor'
  }
];

const DEFAULT_SALES_ORDERS: SalesOrder[] = [
  {
    id: 'Cust-SO-1192',
    tenantId: 'tenant-apex',
    customerName: 'The Grand Plaza Resort',
    deliveryAddress: 'Marina Boulevard, Suite 44',
    status: 'UNFULFILLED',
    items: [
      { productId: 'prod-001', productName: 'Wireless Earbuds Pro', sku: 'ELE-EAR-001', quantityOrdered: 5, quantityPicked: 0, price: 89.99 },
      { productId: 'prod-005', productName: 'USB-C Fast Charger (30W)', sku: 'ELE-CHG-005', quantityOrdered: 10, quantityPicked: 0, price: 19.95 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'Cust-SO-8822',
    tenantId: 'tenant-apex',
    customerName: 'Marcus Logistics Center',
    deliveryAddress: 'Changi Logistics Park, Gate 5',
    status: 'SHIPPED',
    items: [
      { productId: 'prod-003', productName: 'Stainless Steel Water Bottle', sku: 'SPO-WTR-003', quantityOrdered: 20, quantityPicked: 20, price: 24.50 }
    ],
    createdAt: new Date(Date.now() - 1 * 3600 * 1000 * 24).toISOString(),
    carrierName: 'J&T Express',
    shippingService: 'ECO Saver delivery',
    shippingCost: 8.50,
    trackingNumber: 'TRK-JNT-440283112',
    trackingStep: 'IN_TRANSIT',
    trackingLogs: [
      '[10:15:22] Shipping Label created at origin terminal.',
      '[11:34:00] Sorting completed. Dispatched en-route Changi Gateway.'
    ]
  },
  {
    id: 'Cust-SO-5061',
    tenantId: 'tenant-nova',
    customerName: 'Luxe Living Office Studio',
    deliveryAddress: 'Orchard Orchard, Tower C',
    status: 'DELIVERED',
    items: [
      { productId: 'prod-002', productName: 'Ergonomic Office Chair', sku: 'FUR-CHR-002', quantityOrdered: 2, quantityPicked: 2, price: 249.00 }
    ],
    createdAt: new Date(Date.now() - 4 * 3600 * 1000 * 24).toISOString(),
    carrierName: 'Ninja Van',
    shippingService: 'Standard Next Day courier',
    shippingCost: 18.20,
    trackingNumber: 'TRK-NVN-552910384',
    trackingStep: 'DELIVERED',
    trackingLogs: [
      '[09:00:00] Sample consignment details synced via API.',
      '[14:12:11] Consignment successfully delivered. Contactless handoff.'
    ]
  }
];

export default function App() {
  // --- Core States ---
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [currentTenantId, setCurrentTenantId] = useState<string>('tenant-apex');

  const tenantProducts = products.filter(p => p.tenantId === currentTenantId || (!p.tenantId && currentTenantId === 'tenant-apex'));
  const tenantTransactions = transactions.filter(t => t.tenantId === currentTenantId || (!t.tenantId && currentTenantId === 'tenant-apex'));
  
  // --- Enterprise Gate state (SSO, limit check and authorizations list) ---
  const [currentRole, setCurrentRole] = useState<UserRole>('Operations Director');
  const [approvalLimit, setApprovalLimit] = useState<number>(1000);
  const [isSsoEnforced, setIsSsoEnforced] = useState<boolean>(false);

  // --- Dynamic Enterprise Ledgers States ---
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [countSessions, setCountSessions] = useState<CycleCountSession[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);

  // --- Sync & Network ---
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncState, setSyncState] = useState<SyncState>({
    pendingSyncCount: 0,
    lastSyncedAt: null,
    connectionMode: 'online'
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // --- Layout Preferences ---
  const [deviceLayout, setDeviceLayout] = useState<'responsive' | 'mobile-sim' | 'desktop-sim'>('responsive');
  const [activeTab, setActiveTab] = useState<'all' | 'planner' | 'logs' | 'labels' | 'copilot' | 'procurement' | 'count' | 'fulfillment' | 'analytics' | 'directory-sso'>('all');
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('logiledger_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('logiledger_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // --- Filtering & Selection ---
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockLevelFilter, setStockLevelFilter] = useState<'ALL' | 'LOW' | 'IN_STOCK' | 'OUT'>('ALL');
  
  // --- Batch Adjustment Inputs ---
  const [batchCategory, setBatchCategory] = useState<string>('');
  const [batchLocation, setBatchLocation] = useState<string>('');
  const [batchSupplier, setBatchSupplier] = useState<string>('');
  const [batchQtyAction, setBatchQtyAction] = useState<'NONE' | 'SET' | 'ADD' | 'SUBTRACT'>('NONE');
  const [batchQtyValue, setBatchQtyValue] = useState<number>(0);
  
  // --- Modal Controllers ---
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return !localStorage.getItem('logiledger_onboarding_completed_v1');
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  
  // --- Notification Banner ---
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // --- Low Stock / Threshold Alerts ---
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>(() => {
    const saved = localStorage.getItem('logiledger_stock_alerts_v1');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeToastAlerts, setActiveToastAlerts] = useState<StockAlert[]>([]);
  const [isAlertDropdownOpen, setIsAlertDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('logiledger_stock_alerts_v1', JSON.stringify(stockAlerts));
  }, [stockAlerts]);

  // --- Auth state change listener ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        showNotification(`Welcome back, ${currentUser.displayName || 'Operator'}! Secure cloud session active.`, 'success');
      } else {
        showNotification('Operating in local sandbox mode. Sign in to synchronize products in real-time.', 'info');
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // --- Real-time Stock Updates Listener ---
  useEffect(() => {
    if (!user || !isOnline) return;

    // Real-time listener for products
    const qProducts = query(collection(db, 'products'), where('createdBy', '==', user.uid));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const cloudProducts: Product[] = [];
      snapshot.forEach((doc) => {
        cloudProducts.push(doc.data() as Product);
      });
      if (cloudProducts.length > 0) {
        localStorage.setItem('retail_inventory_products', JSON.stringify(cloudProducts));
        setProducts(cloudProducts);
      }
    }, (error) => {
      console.error("Products subscription error:", error);
    });

    // Real-time listener for categories
    const qCategories = query(collection(db, 'categories'), where('createdBy', '==', user.uid));
    const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
      const cloudCategories: Category[] = [];
      snapshot.forEach((doc) => {
        cloudCategories.push(doc.data() as Category);
      });
      if (cloudCategories.length > 0) {
        localStorage.setItem('retail_inventory_categories', JSON.stringify(cloudCategories));
        setCategories(cloudCategories);
      }
    }, (error) => {
      console.error("Categories subscription error:", error);
    });

    // Real-time listener for transactions
    const qTransactions = query(collection(db, 'transactions'), where('userId', '==', user.uid));
    const unsubscribeTransactions = onSnapshot(qTransactions, (snapshot) => {
      const cloudTransactions: Transaction[] = [];
      snapshot.forEach((doc) => {
        cloudTransactions.push(doc.data() as Transaction);
      });
      cloudTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      if (cloudTransactions.length > 0) {
        localStorage.setItem('retail_inventory_transactions', JSON.stringify(cloudTransactions));
        setTransactions(cloudTransactions);
      }
    }, (error) => {
      console.error("Transactions subscription error:", error);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeTransactions();
    };
  }, [user, isOnline]);

  // --- Initial Load ---
  useEffect(() => {
    loadDatabase();
    
    // Auto sync state tracker
    const pendingCount = getPendingSyncCount();
    const lastSync = getLastSyncedTime();
    setSyncState({
      pendingSyncCount: pendingCount,
      lastSyncedAt: lastSync,
      connectionMode: 'online'
    });

    // Real browser status listeners
    const triggerOnline = () => {
      setIsOnline(true);
      showNotification('Internet connection detected. Preparing cloud sync stream...', 'success');
    };
    const triggerOffline = () => {
      setIsOnline(false);
      showNotification('Network offline. Switching to local persistence ledger mode.', 'warning');
    };

    window.addEventListener('online', triggerOnline);
    window.addEventListener('offline', triggerOffline);

    return () => {
      window.removeEventListener('online', triggerOnline);
      window.removeEventListener('offline', triggerOffline);
    };
  }, []);

  const loadDatabase = () => {
    const p = getLocalProducts();
    const t = getLocalTransactions();
    const c = getLocalCategories();
    setProducts(p);
    setTransactions(t);
    setCategories(c);

    // Load Phase 2 Enterprise Ledgers
    const storedPOs = localStorage.getItem('logiledger_purchase_orders');
    if (storedPOs) {
      try {
        setPurchaseOrders(JSON.parse(storedPOs));
      } catch (e) {
        setPurchaseOrders(DEFAULT_PURCHASE_ORDERS);
      }
    } else {
      localStorage.setItem('logiledger_purchase_orders', JSON.stringify(DEFAULT_PURCHASE_ORDERS));
      setPurchaseOrders(DEFAULT_PURCHASE_ORDERS);
    }

    const storedCounts = localStorage.getItem('logiledger_count_sessions');
    if (storedCounts) {
      try {
        setCountSessions(JSON.parse(storedCounts));
      } catch (e) {
        setCountSessions(DEFAULT_CYCLE_COUNTS);
      }
    } else {
      localStorage.setItem('logiledger_count_sessions', JSON.stringify(DEFAULT_CYCLE_COUNTS));
      setCountSessions(DEFAULT_CYCLE_COUNTS);
    }

    const storedSales = localStorage.getItem('logiledger_sales_orders');
    if (storedSales) {
      try {
        setSalesOrders(JSON.parse(storedSales));
      } catch (e) {
        setSalesOrders(DEFAULT_SALES_ORDERS);
      }
    } else {
      localStorage.setItem('logiledger_sales_orders', JSON.stringify(DEFAULT_SALES_ORDERS));
      setSalesOrders(DEFAULT_SALES_ORDERS);
    }

    const storedWebhooks = localStorage.getItem('logiledger_webhook_logs');
    if (storedWebhooks) {
      try {
        setWebhookLogs(JSON.parse(storedWebhooks));
      } catch (e) {
        setWebhookLogs([]);
      }
    } else {
      setWebhookLogs([]);
    }
  };

  // --- Purchase Order Operations ---
  const handleSavePurchaseOrder = (newPo: PurchaseOrder) => {
    setPurchaseOrders(prev => {
      const idx = prev.findIndex(item => item.id === newPo.id);
      let nextList = [...prev];
      if (idx >= 0) {
        nextList[idx] = newPo;
      } else {
        nextList.unshift(newPo);
      }
      localStorage.setItem('logiledger_purchase_orders', JSON.stringify(nextList));
      return nextList;
    });
  };

  // --- Cycle Count Operations ---
  const handleSaveCountSession = (newSession: CycleCountSession) => {
    setCountSessions(prev => {
      const idx = prev.findIndex(item => item.id === newSession.id);
      let nextList = [...prev];
      if (idx >= 0) {
        nextList[idx] = newSession;
      } else {
        nextList.unshift(newSession);
      }
      localStorage.setItem('logiledger_count_sessions', JSON.stringify(nextList));
      return nextList;
    });
  };

  // --- Customer Sales Order Operations ---
  const handleUpdateSalesOrder = (newOrder: SalesOrder) => {
    setSalesOrders(prev => {
      const idx = prev.findIndex(item => item.id === newOrder.id);
      let nextList = [...prev];
      if (idx >= 0) {
        nextList[idx] = newOrder;
      } else {
        nextList.unshift(newOrder);
      }
      localStorage.setItem('logiledger_sales_orders', JSON.stringify(nextList));
      return nextList;
    });
  };

  // --- Webhooks simulation triggers ---
  const handleTriggerWebhook = (event: string, payload: any) => {
    const freshLog: WebhookLog = {
      id: `wh-${Math.floor(100000 + Math.random() * 900000)}`,
      event,
      payload: JSON.stringify(payload),
      timestamp: new Date().toISOString(),
      tenantId: currentTenantId
    };

    setWebhookLogs(prev => {
      const nextList = [freshLog, ...prev].slice(0, 50); // cap to 50 logs max
      localStorage.setItem('logiledger_webhook_logs', JSON.stringify(nextList));
      return nextList;
    });
  };

  // --- Core Adjustment sync handlers ---
  const handleReceiveInventory = (productId: string, qty: number, reason: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const updatedQty = product.quantity + qty;
      handleSaveProduct({
        ...product,
        quantity: updatedQty
      }, reason);
    }
  };

  const handleShipInventory = (productId: string, qty: number, reason: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const updatedQty = Math.max(0, product.quantity - qty);
      handleSaveProduct({
        ...product,
        quantity: updatedQty
      }, reason);
    }
  };

  const handleReturnInventory = (productId: string, qty: number, disposition: 'RESTOCKED' | 'WRITE_OFF') => {
    const product = products.find(p => p.id === productId);
    if (product) {
      if (disposition === 'RESTOCKED') {
        const updatedQty = product.quantity + qty;
        handleSaveProduct({
          ...product,
          quantity: updatedQty
        }, `Inventory replenishment from authorized RMA return (restocked).`);
      } else {
        // Log transaction for write-off but don't add back to stock!
        createLocalTransaction({
          id: `tx-${Math.random().toString(36).substr(2, 9)}`,
          productId: product.id,
          productName: product.name,
          type: 'OUT',
          quantityChanged: -qty,
          previousQuantity: product.quantity,
          newQuantity: product.quantity,
          reason: `RMA Damage Return Audit: product disposed due to transit water/physical defect (Written Off from accounts).`,
          timestamp: new Date().toISOString(),
          userId: 'offline-user',
          tenantId: currentTenantId
        });
        loadDatabase();
      }
    }
  };

  const handleAdjustProductStock = (productId: string, newQty: number, reason: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      handleSaveProduct({
        ...product,
        quantity: newQty
      }, reason);
    }
  };

  const handleUpdateProductTrackingDetails = (
    productId: string, 
    type: 'NONE' | 'LOT' | 'SERIAL' | 'EXPIRY', 
    lot?: string, 
    serial?: string, 
    expiry?: string
  ) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      handleSaveProduct({
        ...product,
        trackingType: type,
        lotNumber: lot,
        serialNumber: serial,
        expiryDate: expiry
      }, `Adjusted safety tracking details on SKU ledger.`);
    }
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const checkThresholdAlert = (product: Product, prevQty: number) => {
    // Triggers when quantity falls of threshold and has actually changed or the product is newly registered under threshold
    if (product.quantity <= product.minStock && product.quantity !== prevQty) {
      const isOutOfStock = product.quantity === 0;
      const newAlert: StockAlert = {
        id: `alert-${Math.random().toString(36).substr(2, 9)}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentQty: product.quantity,
        minStock: product.minStock,
        timestamp: new Date().toISOString(),
        type: isOutOfStock ? 'out_of_stock' : 'threshold_reached',
        isRead: false,
        tenantId: currentTenantId
      };

      setStockAlerts(prev => {
        const filtered = prev.filter(item => item.productId !== product.id);
        return [newAlert, ...filtered].slice(0, 50);
      });
      setActiveToastAlerts(prev => {
        const filtered = prev.filter(item => item.productId !== product.id);
        return [newAlert, ...filtered];
      });

      // Automatically clear toast alert from view list after 7 seconds
      setTimeout(() => {
        setActiveToastAlerts(prev => prev.filter(t => t.id !== newAlert.id));
      }, 7000);
    }
  };

  // --- Actions ---
  const handleSaveProduct = async (updatedProduct: Product, reason?: string) => {
    const isNew = !products.some(p => p.id === updatedProduct.id);
    const prevQty = products.find(p => p.id === updatedProduct.id)?.quantity || 0;
    
    // Set metadata creator and active tenant namespace
    const finalProduct: Product = {
      ...updatedProduct,
      tenantId: currentTenantId,
      createdBy: user ? user.uid : (updatedProduct.createdBy === 'system' ? 'system' : 'offline-user')
    };

    saveLocalProduct(finalProduct, reason);
    checkThresholdAlert(finalProduct, prevQty);
    loadDatabase();
    updateSyncMetrics();

    setIsFormOpen(false);
    setSelectedProduct(null);

    if (isOnline && user) {
      try {
        await setDoc(doc(db, 'products', finalProduct.id), finalProduct);
        const qtyDiff = finalProduct.quantity - prevQty;
        if (qtyDiff !== 0) {
          const freshTx: Transaction = {
            id: `tx-${Math.random().toString(36).substr(2, 9)}`,
            productId: finalProduct.id,
            productName: finalProduct.name,
            type: qtyDiff > 0 ? 'IN' : 'OUT',
            quantityChanged: Math.abs(qtyDiff),
            previousQuantity: prevQty,
            newQuantity: finalProduct.quantity,
            reason: reason || (qtyDiff > 0 ? 'Manual Stock In' : 'Manual Stock Out'),
            timestamp: new Date().toISOString(),
            userId: user.uid,
            tenantId: currentTenantId
          };
          await setDoc(doc(db, 'transactions', freshTx.id), freshTx);
        }
        showNotification(
          isNew 
            ? `Successfully registered and synced: ${finalProduct.name}`
            : `Updated and cloud-synced stock for: ${finalProduct.name}`,
          'success'
        );
      } catch (error) {
        console.error("Cloud syncing failed:", error);
        showNotification(`Saved locally. Could not sync with cloud.`, 'info');
      }
    } else {
      showNotification(
        isNew 
          ? `Successfully registered locally: ${finalProduct.name}`
          : `Updated local stock coordinates for: ${finalProduct.name}`,
        'success'
      );
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete "${name}" from your active store files?`)) {
      const prod = products.find(p => p.id === id);
      const isSystem = prod?.createdBy === 'system';
      
      // Record removal in transaction ledger
      if (prod) {
        const qty = prod.quantity;
        const freshTx: Transaction = {
          id: `tx-${Math.random().toString(36).substr(2, 9)}`,
          productId: id,
          productName: name,
          type: 'OUT',
          quantityChanged: qty,
          previousQuantity: qty,
          newQuantity: 0,
          reason: `Product listing permanently deleted from record index.`,
          timestamp: new Date().toISOString(),
          userId: user ? user.uid : 'offline-user',
          tenantId: currentTenantId
        };
        createLocalTransaction(freshTx);
        
        if (isOnline && user && !isSystem) {
          try {
            await setDoc(doc(db, 'transactions', freshTx.id), freshTx);
          } catch (e) {
            console.error(e);
          }
        }
      }

      deleteLocalProduct(id);
      loadDatabase();
      updateSyncMetrics();

      if (isOnline && user && !isSystem) {
        try {
          await deleteDoc(doc(db, 'products', id));
          showNotification(`Permanently deleted and cloud-synced: ${name}`, 'info');
        } catch (error) {
          console.error("Cloud delete failed:", error);
          showNotification(`Deleted locally: ${name}`, 'info');
        }
      } else {
        showNotification(`Deleted item list reference: ${name}`, 'info');
      }
    }
  };

  const handleBatchUpdate = async (updates: {
    category?: string;
    location?: string;
    supplier?: string;
    quantityAdjustment?: { type: 'SET' | 'ADD' | 'SUBTRACT'; value: number };
  }) => {
    if (selectedProductIds.length === 0) return;

    let successCount = 0;
    const promises: Promise<any>[] = [];
    const reason = `Bulk update characteristics of ${selectedProductIds.length} select items.`;

    for (const pId of selectedProductIds) {
      const product = products.find(p => p.id === pId);
      if (!product) continue;

      const prevQty = product.quantity;
      let newQty = prevQty;

      if (updates.quantityAdjustment) {
        const { type, value } = updates.quantityAdjustment;
        if (type === 'SET') {
          newQty = Math.max(0, value);
        } else if (type === 'ADD') {
          newQty = prevQty + value;
        } else if (type === 'SUBTRACT') {
          newQty = Math.max(0, prevQty - value);
        }
      }

      const finalProduct: Product = {
        ...product,
        category: updates.category !== undefined && updates.category !== "" ? updates.category : product.category,
        location: updates.location !== undefined ? updates.location : product.location,
        supplier: updates.supplier !== undefined ? updates.supplier : product.supplier,
        quantity: newQty,
        updatedAt: new Date().toISOString()
      };

      saveLocalProduct(finalProduct, reason);
      checkThresholdAlert(finalProduct, prevQty);
      
      const isSystem = product.createdBy === 'system';
      if (isOnline && user && !isSystem) {
        const promise = (async () => {
          try {
            await setDoc(doc(db, 'products', finalProduct.id), finalProduct);
            const qtyDiff = newQty - prevQty;
            if (qtyDiff !== 0) {
              const freshTx: Transaction = {
                id: `tx-${Math.random().toString(36).substr(2, 9)}`,
                productId: finalProduct.id,
                productName: finalProduct.name,
                type: qtyDiff > 0 ? 'IN' : 'OUT',
                quantityChanged: Math.abs(qtyDiff),
                previousQuantity: prevQty,
                newQuantity: newQty,
                reason,
                timestamp: new Date().toISOString(),
                userId: user.uid,
                tenantId: currentTenantId
              };
              await setDoc(doc(db, 'transactions', freshTx.id), freshTx);
            }
          } catch (e) {
            console.error("Cloud sync of batch update failed for ID:", finalProduct.id, e);
          }
        })();
        promises.push(promise);
      }
      successCount++;
    }

    if (promises.length > 0) {
      try {
        await Promise.all(promises);
      } catch (e) {
        console.error("Some properties failed syncing:", e);
      }
    }

    loadDatabase();
    updateSyncMetrics();
    setSelectedProductIds([]);
    showNotification(`Successfully applied bulk configurations to ${successCount} products.`, 'success');
  };

  const handleBatchDelete = async () => {
    if (selectedProductIds.length === 0) return;
    if (confirm(`Are you sure you want to permanently delete these ${selectedProductIds.length} designated products from your index listings?`)) {
      let count = 0;
      const promises: Promise<any>[] = [];

      for (const pId of selectedProductIds) {
        const prod = products.find(p => p.id === pId);
        if (!prod) continue;
        const isSystem = prod.createdBy === 'system';

        const qty = prod.quantity;
        const freshTx: Transaction = {
          id: `tx-${Math.random().toString(36).substr(2, 9)}`,
          productId: pId,
          productName: prod.name,
          type: 'OUT',
          quantityChanged: qty,
          previousQuantity: qty,
          newQuantity: 0,
          reason: `Bulk items indices deletion.`,
          timestamp: new Date().toISOString(),
          userId: user ? user.uid : 'offline-user',
          tenantId: currentTenantId
        };
        
        createLocalTransaction(freshTx);
        deleteLocalProduct(pId);

        if (isOnline && user && !isSystem) {
          const promise = (async () => {
            try {
              await setDoc(doc(db, 'transactions', freshTx.id), freshTx);
              await deleteDoc(doc(db, 'products', pId));
            } catch (e) {
              console.error("Cloud failure inside batch destruction loop:", pId, e);
            }
          })();
          promises.push(promise);
        }
        count++;
      }

      if (promises.length > 0) {
        try {
          await Promise.all(promises);
        } catch (e) {
          console.error(e);
        }
      }

      loadDatabase();
      updateSyncMetrics();
      setSelectedProductIds([]);
      showNotification(`Bulk purge complete, deleted ${count} selected records successfully!`, 'info');
    }
  };

  const handleCreateCategory = async (newCat: Category) => {
    const finalCat = {
      ...newCat,
      createdBy: user ? user.uid : 'offline-user'
    };
    saveLocalCategory(finalCat);
    loadDatabase();
    updateSyncMetrics();

    if (isOnline && user) {
      try {
        await setDoc(doc(db, 'categories', finalCat.id), finalCat);
        showNotification(`New department category synced: "${finalCat.name}"`, 'success');
      } catch (error) {
        console.error("Cloud sync of category failed:", error);
        showNotification(`New department category added: "${finalCat.name}"`, 'success');
      }
    } else {
      showNotification(`New department category added: "${finalCat.name}"`, 'success');
    }
  };

  const handleBarcodeScanned = (code: string) => {
    setIsScannerOpen(false);
    
    // Search the database for matching UPC/EAN or SKU within active tenant slice
    const matched = tenantProducts.find(p => p.barcode === code || p.sku === code || p.id === code);

    if (matched) {
      // Trigger instant restock or edit modal
      setSelectedProduct(matched);
      setIsFormOpen(true);
      showNotification(`Matched scanned barcode payload: "${matched.name}"`, 'success');
    } else {
      // Prompt user option to create registration for this code
      if (confirm(`Barcode "${code}" was not found in active database. Register as a new SKU?`)) {
        setSelectedProduct(null); // Clear active item to configure fresh
        
        // Setup initial object, passing scanned barcode parameter
        const tempId = Math.floor(100000 + Math.random() * 900000).toString();
        const freshProduct: Product = {
          id: `prod-${tempId}`,
          name: '',
          barcode: code,
          sku: `SKU-${tempId}`,
          category: categories[0]?.name || 'Electronics',
          price: 0,
          cost: 0,
          quantity: 0,
          minStock: 5,
          supplier: '',
          location: '',
          updatedAt: new Date().toISOString(),
          createdBy: user ? user.uid : 'offline-user',
          tenantId: currentTenantId
        };
        setSelectedProduct(freshProduct);
        setIsFormOpen(true);
      }
    }
  };

  const handleRestockOrder = (item: Product) => {
    const orderQty = (item.minStock - item.quantity) + 15;
    
    const updated: Product = {
      ...item,
      quantity: item.quantity + orderQty,
      updatedAt: new Date().toISOString()
    };

    handleSaveProduct(updated, `Automatic Restock Replenish (+${orderQty})`);
  };

  const updateSyncMetrics = () => {
    setSyncState(prev => ({
      ...prev,
      pendingSyncCount: getPendingSyncCount(),
    }));
  };

  // --- Real Cloud Sync Loop ---
  const handleSimulateSyncCloud = async () => {
    if (!isOnline) {
      showNotification('Cannot perform sync while simulated offline mode is engaged.', 'warning');
      return;
    }

    if (!user) {
      showNotification('Sign in with your Google account to enable permanent cloud synchronization.', 'warning');
      return;
    }
    
    setIsSyncing(true);
    showNotification('Connecting to secure cloud nodes and resolving conflicts...', 'info');

    try {
      // Push all local categories
      const localCats = getLocalCategories();
      for (const cat of localCats) {
        if (cat.createdBy === 'offline-user' || cat.createdBy === 'system') {
          const updatedCat = { ...cat, createdBy: user.uid };
          await setDoc(doc(db, 'categories', cat.id), updatedCat);
        }
      }

      // Push all local products
      const localProds = getLocalProducts();
      for (const prod of localProds) {
        if (prod.createdBy === 'offline-user' || prod.createdBy === 'system') {
          const updatedProd = { ...prod, tenantId: prod.tenantId || 'tenant-apex', createdBy: user.uid };
          await setDoc(doc(db, 'products', prod.id), updatedProd);
        }
      }

      // Push all transactions
      const localTxs = getLocalTransactions();
      for (const tx of localTxs) {
        if (tx.userId === 'offline-user' || tx.userId === 'system') {
          const updatedTx = { ...tx, tenantId: tx.tenantId || 'tenant-apex', userId: user.uid };
          await setDoc(doc(db, 'transactions', tx.id), updatedTx);
        }
      }

      clearPendingSync();
      updateSyncMetrics();
      setSyncState(prev => ({
        ...prev,
        lastSyncedAt: new Date().toISOString()
      }));
      showNotification('Cloud synchronization complete! Relational tables aligned, offline queue flushed.', 'success');
    } catch (error) {
      console.error(error);
      showNotification('Cloud synchronization failed. Please check internet connections or parameters.', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleOnlineMode = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    if (!nextState) {
      showNotification('System is now entirely offline. Changes will queue safely into local ledger cache.', 'warning');
    } else {
      showNotification('System restored container connectivity. Active syncing nodes re-established.', 'success');
    }
  };

  // --- Filtering computations ---
  const filteredProducts = tenantProducts.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.supplier.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockLevelFilter === 'LOW') {
      matchesStock = p.quantity <= p.minStock && p.quantity > 0;
    } else if (stockLevelFilter === 'OUT') {
      matchesStock = p.quantity === 0;
    } else if (stockLevelFilter === 'IN_STOCK') {
      matchesStock = p.quantity > p.minStock;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // --- Sub-View Layout Panels ---
  const renderTabContent = () => {
    const forceMobile = deviceLayout === 'mobile-sim';
    switch (activeTab) {
      case 'copilot':
        return (
          <CopilotHub
            products={tenantProducts}
            transactions={tenantTransactions}
            currentRole={currentRole}
            currentTenantId={currentTenantId}
            showNotification={showNotification}
          />
        );
      case 'planner':
        return <InventoryStats products={tenantProducts} onRestockClick={handleRestockOrder} forceMobile={forceMobile} />;
      case 'procurement':
        return (
          <ProcurementHub
            products={products}
            currentRole={currentRole}
            approvalLimit={approvalLimit}
            purchaseOrders={purchaseOrders}
            onReceiveInventory={handleReceiveInventory}
            onSavePurchaseOrder={handleSavePurchaseOrder}
          />
        );
      case 'count':
        return (
          <CycleCountHub
            products={tenantProducts}
            currentRole={currentRole}
            onAdjustProductStock={handleAdjustProductStock}
            onUpdateProductTrackingDetails={handleUpdateProductTrackingDetails}
            countSessions={countSessions}
            onSaveCountSession={handleSaveCountSession}
          />
        );
      case 'fulfillment':
        return (
          <FulfillmentHub
            salesOrders={salesOrders}
            currentRole={currentRole}
            onUpdateSalesOrder={handleUpdateSalesOrder}
            onShipInventory={handleShipInventory}
            onReturnInventory={handleReturnInventory}
          />
        );
      case 'analytics':
        return (
          <AnalyticsHub
            products={tenantProducts}
            currentRole={currentRole}
            webhookLogs={webhookLogs}
            onTriggerWebhook={handleTriggerWebhook}
          />
        );
      case 'directory-sso':
        return (
          <DirectorySSOHub
            currentRole={currentRole}
            onChangeRole={setCurrentRole}
            approvalLimit={approvalLimit}
            onChangeApprovalLimit={setApprovalLimit}
            isSsoEnforced={isSsoEnforced}
            onToggleSso={() => setIsSsoEnforced(prev => !prev)}
          />
        );
      case 'logs':
        return <TransactionsHistory transactions={tenantTransactions} forceMobile={forceMobile} onClearLogs={() => {
          const otherTenantTxs = transactions.filter(t => t.tenantId !== currentTenantId && (t.tenantId || currentTenantId !== 'tenant-apex'));
          localStorage.setItem('retail_inventory_transactions', JSON.stringify(otherTenantTxs));
          loadDatabase();
          showNotification('Audit log records for active merchant profile flushed.', 'info');
        }} />;
      case 'labels':
        return renderBarcodeSheet();
      case 'all':
      default:
        return renderInventoryDatabasePanel();
    }
  };

  // --- Label sheets generator ---
  const renderBarcodeSheet = () => {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 font-sans shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-950 text-base flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-605 text-blue-600" /> Printable Barcode Labels
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Print labels to stick on items. Use your smartphone to scan them via webcam to test automated database routing.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-250 text-gray-700 rounded-xl text-xs font-semibold hover:shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-gray-500" /> Print Sheet
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {tenantProducts.map((item) => (
            <div
              key={item.id}
              onClick={() => handleBarcodeScanned(item.barcode)}
              className="bg-white text-gray-900 border border-gray-200 p-4 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:ring-2 hover:ring-blue-605 hover:ring-blue-600 transition group relative shadow-xs"
              title="Click to simulate scan scan on this item code"
            >
              <div className="absolute top-2 right-2 bg-blue-600 text-white font-semibold rounded text-[8px] px-1.5 py-0.5 uppercase tracking-wider scale-0 group-hover:scale-100 transition origin-right font-mono">
                Scan Code
              </div>

              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1 leading-snug w-full truncate">
                {item.name}
              </span>
              
              {/* Fake visually beautiful block barcode lines */}
              <div className="w-full flex justify-center py-2 h-10 select-none">
                <div className="flex gap-[1.5px] items-stretch h-full overflow-hidden w-4/5 max-w-[120px]">
                  {Array.from({ length: 25 }).map((_, i) => {
                    const barWidths = [1, 2, 3, 1, 4, 1, 2, 1, 3, 2];
                    const widthClass = barWidths[i % barWidths.length];
                    const isWhite = i % 4 === 1;
                    return (
                      <div
                        key={i}
                        style={{ flexGrow: widthClass }}
                        className={`${isWhite ? 'bg-transparent' : 'bg-slate-950'} h-full`}
                      />
                    );
                  })}
                </div>
              </div>

              <span className="font-mono text-[9px] font-bold text-gray-800 tracking-[0.2em] mt-1">
                {item.barcode}
              </span>
              <span className="text-[8px] font-mono font-medium text-gray-400 mt-0.5 uppercase space-x-1">
                <span>SKU: {item.sku}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderInventoryDatabasePanel = () => {
    const forceMobile = deviceLayout === 'mobile-sim';

    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 space-y-6 font-sans shadow-xs">
        
        {/* Tenant Workspace Info Alert */}
        {(() => {
          const activeTenant = TENANTS.find(t => t.id === currentTenantId);
          if (!activeTenant) return null;
          return (
            <div className={`p-4 rounded-xl border flex flex-col gap-3 text-xs bg-gray-50 border-gray-200 ${forceMobile ? '' : 'md:flex-row md:items-center justify-between'}`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <span className="font-bold text-gray-955 text-[13px]">{activeTenant.name} Corporate Profile</span>
                </div>
                <p className="text-gray-500 max-w-2xl leading-relaxed">{activeTenant.description}</p>
              </div>
              <div className={`flex items-center gap-4 shrink-0 font-mono text-[9px] text-gray-400 py-1.5 border-t border-gray-200 mt-2 ${forceMobile ? '' : 'md:border-t-0 md:mt-0'}`}>
                <div className="flex flex-col">
                  <span className="uppercase text-[8px] font-bold tracking-wider text-gray-400">Secure Profile Space</span>
                  <span className="text-gray-700 font-bold">{activeTenant.id}</span>
                </div>
                <div className="flex flex-col">
                  <span className="uppercase text-[8px] font-bold tracking-wider text-gray-400">Primary Material Vendor</span>
                  <span className="text-gray-700 font-bold">{activeTenant.primarySupplier}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Controls, Filters & Sorters */}
        <div className={`flex flex-col gap-4 ${forceMobile ? '' : 'xl:flex-row xl:items-center justify-between'}`}>
          
          <div className={`flex-1 grid gap-3 ${forceMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Product SKU, vendor, or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 hover:border-gray-300 focus:border-blue-600 focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 outline-none transition"
              />
            </div>

            {/* Department Selector */}
            <div className="flex items-center bg-gray-50 border border-gray-250 hover:border-gray-300 rounded-xl px-3 py-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mr-2 shrink-0">Cat:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 bg-transparent text-xs text-gray-900 outline-none select-none font-semibold cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Stock Level Selector */}
            <div className="flex items-center bg-gray-50 border border-gray-250 hover:border-gray-300 rounded-xl px-3 py-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mr-2 shrink-0">Status:</span>
              <select
                value={stockLevelFilter}
                onChange={(e) => setStockLevelFilter(e.target.value as any)}
                className="flex-1 bg-transparent text-xs text-gray-900 outline-none select-none font-semibold cursor-pointer"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="LOW">Low Threshold Alert</option>
                <option value="IN_STOCK">Healthy Stock (Good)</option>
                <option value="OUT">Out Of Stock (Zero)</option>
              </select>
            </div>
          </div>

          {/* Quick Creator Button */}
          <button
            onClick={() => {
              setSelectedProduct(null);
              setIsFormOpen(true);
            }}
            className="flex items-center justify-center gap-1 px-5 py-2.5 bg-blue-605 bg-blue-650 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-900/10 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Product SKU
          </button>
        </div>

        {/* Batch Operations Console */}
        <AnimatePresence>
          {selectedProductIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3 shadow-xs"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-sm shadow-indigo-600/10">
                    {selectedProductIds.length}
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-950 text-xs">Bulk Item Actions Active</h4>
                    <p className="text-[10px] text-indigo-600">Select bulk updates below and apply them to all {selectedProductIds.length} checked logs.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end lg:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductIds([]);
                      setBatchCategory('');
                      setBatchLocation('');
                      setBatchSupplier('');
                      setBatchQtyAction('NONE');
                      setBatchQtyValue(0);
                    }}
                    className="px-3 py-1.5 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-[10px] uppercase tracking-wider transition bg-transparent"
                  >
                    Clear Selections
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchDelete}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete selection ({selectedProductIds.length})</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-indigo-150 my-2 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                {/* Category dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-indigo-800">Set Category</label>
                  <select
                    value={batchCategory}
                    onChange={(e) => setBatchCategory(e.target.value)}
                    className="w-full bg-white border border-indigo-200 hover:border-indigo-300 focus:border-indigo-600 rounded-lg px-2.5 py-1.5 outline-none font-semibold text-xs text-gray-800 cursor-pointer"
                  >
                    <option value="">(No Change)</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Location Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-indigo-800">Set Shelf Location</label>
                  <input
                    type="text"
                    value={batchLocation}
                    onChange={(e) => setBatchLocation(e.target.value)}
                    placeholder="(No Change)"
                    className="w-full bg-white border border-indigo-200 hover:border-indigo-300 focus:border-indigo-600 rounded-lg px-2.5 py-1.5 outline-none text-xs text-gray-800"
                  />
                </div>

                {/* Supplier input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-indigo-800">Set Vendor Supplier</label>
                  <input
                    type="text"
                    value={batchSupplier}
                    onChange={(e) => setBatchSupplier(e.target.value)}
                    placeholder="(No Change)"
                    className="w-full bg-white border border-indigo-200 hover:border-indigo-300 focus:border-indigo-600 rounded-lg px-2.5 py-1.5 outline-none text-xs text-gray-800"
                  />
                </div>

                {/* Quantity adjustment logic */}
                <div className="space-y-1 sm:col-span-2 lg:col-span-2 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-indigo-800">Qty Adjustment</label>
                    <select
                      value={batchQtyAction}
                      onChange={(e) => setBatchQtyAction(e.target.value as any)}
                      className="w-full bg-white border border-indigo-200 hover:border-indigo-300 focus:border-indigo-600 rounded-lg px-2.5 py-1.5 outline-none font-semibold text-xs text-gray-800 cursor-pointer"
                    >
                      <option value="NONE">No Change</option>
                      <option value="SET">Set To Exact</option>
                      <option value="ADD">Increment (+)</option>
                      <option value="SUBTRACT">Decrement (-)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-indigo-800">Qty Amount</label>
                    <input
                      type="number"
                      value={batchQtyValue}
                      disabled={batchQtyAction === 'NONE'}
                      onChange={(e) => setBatchQtyValue(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full bg-white border border-indigo-200 hover:border-indigo-300 focus:border-indigo-600 rounded-lg px-2.5 py-1.5 outline-none text-xs text-gray-800 disabled:bg-indigo-50/55 disabled:text-indigo-400 disabled:border-indigo-150"
                    />
                  </div>
                </div>
              </div>

              {/* Apply trigger button */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    const updates: Parameters<typeof handleBatchUpdate>[0] = {};
                    if (batchCategory) updates.category = batchCategory;
                    if (batchLocation !== "") updates.location = batchLocation;
                    if (batchSupplier !== "") updates.supplier = batchSupplier;
                    if (batchQtyAction !== 'NONE') {
                      updates.quantityAdjustment = {
                        type: batchQtyAction,
                        value: batchQtyValue
                      };
                    }

                    if (Object.keys(updates).length === 0) {
                      showNotification("Please select or enter at least one value to batch update.", "warning");
                      return;
                    }

                    await handleBatchUpdate(updates);
                    // Reset batch selection UI controls
                    setBatchCategory('');
                    setBatchLocation('');
                    setBatchSupplier('');
                    setBatchQtyAction('NONE');
                    setBatchQtyValue(0);
                  }}
                  className="flex items-center justify-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-md transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply Bulk Adjustments to {selectedProductIds.length} Items</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Database Grid Container */}
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-xs">
          
          {/* Main Table for Desktop view */}
          <div className={`${forceMobile ? 'hidden' : 'hidden md:block'} overflow-x-auto`}>
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[10px] uppercase tracking-wider font-extrabold text-gray-500 text-center">
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.includes(p.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Merge all filtered products to selections
                          const allFilteredIds = filteredProducts.map(p => p.id);
                          setSelectedProductIds(prev => {
                            const newSelectionSet = new Set([...prev, ...allFilteredIds]);
                            return Array.from(newSelectionSet);
                          });
                        } else {
                          // Remove all filtered products from selections
                          const filteredIdsSet = new Set(filteredProducts.map(p => p.id));
                          setSelectedProductIds(prev => prev.filter(id => !filteredIdsSet.has(id)));
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                    />
                  </th>
                  <th className="py-3 px-4 text-left">Product / SKU</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Location</th>
                  <th className="py-3 px-2">Unit Price</th>
                  <th className="py-3 px-2">Qty</th>
                  <th className="py-3 px-2 text-left">Stock Guard</th>
                  <th className="py-3 px-3">Supplier Vendor</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-xs">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const isLow = p.quantity <= p.minStock && p.quantity > 0;
                    const isOut = p.quantity === 0;

                    return (
                      <tr key={p.id} className={`hover:bg-gray-50/50 transition border-b border-gray-105 border-gray-105/40 text-gray-900 ${selectedProductIds.includes(p.id) ? 'bg-indigo-50/30' : ''}`}>
                        {/* Selector Checkbox */}
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(p.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProductIds(prev => [...prev, p.id]);
                              } else {
                                setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                          />
                        </td>

                        {/* Name & Barcode */}
                        <td className="py-3.5 px-4 font-sans">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=80&q=50";
                                  }}
                                />
                              ) : (
                                <Package className="w-4 h-4 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-gray-955 text-gray-900 text-sm truncate max-w-[200px]" title={p.name}>{p.name}</span>
                              <span className="font-mono text-[9px] text-gray-400 mt-1 flex items-center gap-1.5 flex-wrap">
                                <span>SKU: <strong className="text-gray-600 dark:text-gray-350 font-normal">{p.sku}</strong></span>
                                <span>•</span>
                                <span>Bar: <strong className="text-blue-600 dark:text-blue-400 font-normal cursor-pointer select-all hover:underline" title="Click to copy barcode" onClick={() => {
                                  navigator.clipboard.writeText(p.barcode);
                                  showNotification('Barcode copied to clipboard!', 'info');
                                }}>{p.barcode}</strong></span>
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-2 text-center text-gray-600">
                          <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded font-semibold text-[10px]">
                            {p.category}
                          </span>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-2 text-center text-gray-600 font-mono text-[10px]">
                          {p.location || <span className="text-gray-400 italic">No shelf</span>}
                        </td>

                        {/* Price & Cost Margin */}
                        <td className="py-3.5 px-2 text-center">
                          <div className="flex flex-col font-mono text-[11px]">
                            <span className="font-bold text-gray-900">${p.price.toFixed(2)}</span>
                            <span className="text-[9px] text-gray-400 mt-0.5">Cost: ${p.cost.toFixed(2)}</span>
                          </div>
                        </td>

                        {/* Stock Balance */}
                        <td className="py-3.5 px-2 text-center">
                          <span className={`inline-block font-mono text-xs font-bold px-2 py-1 rounded-lg ${isOut ? 'text-red-600 bg-red-50 border border-red-105' : isLow ? 'text-amber-650 bg-amber-50 border border-amber-200 text-amber-600' : 'text-gray-700 bg-gray-100'}`}>
                            {p.quantity} pcs
                          </span>
                        </td>

                        {/* Level Alerts */}
                        <td className="py-3.5 px-2">
                          {isOut ? (
                            <div className="flex items-center gap-1.5 text-red-600 text-[10px] font-bold uppercase tracking-wider">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                              </span>
                              OUT OF STOCK
                            </div>
                          ) : isLow ? (
                            <div className="flex items-center gap-1.5 text-amber-550 text-[10px] font-semibold tracking-wide text-amber-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              LOW STOCK (Min: {p.minStock})
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-gray-400 text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Good Stock Level
                            </div>
                          )}
                        </td>

                        {/* Supplier */}
                        <td className="py-3.5 px-3 text-gray-600 truncate max-w-[120px]" title={p.supplier}>
                          {p.supplier || <span className="text-gray-400 italic">No vendor</span>}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 text-gray-500">
                            <button
                              onClick={() => {
                                setSelectedProduct(p);
                                setIsFormOpen(true);
                              }}
                              className="p-1.5 hover:bg-gray-100 text-gray-550 hover:text-blue-600 rounded-lg border border-gray-200 hover:border-gray-300 transition cursor-pointer"
                              title="Modify active product characteristics"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg border border-gray-200 hover:border-red-200 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center space-y-2">
                      <Package className="w-8 h-8 text-gray-300 mx-auto" strokeWidth={1} />
                      <h4 className="text-gray-500 font-semibold">No records found</h4>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto">None of your registered product listings matched your selected search criteria or filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Simple Mobile cards view (highly adaptive touch layout) */}
          <div className={`${forceMobile ? 'block divide-y divide-gray-150 bg-white' : 'block md:hidden divide-y divide-gray-150'}`}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const isLow = p.quantity <= p.minStock && p.quantity > 0;
                const isOut = p.quantity === 0;

                return (
                  <div key={p.id} className={`p-4 space-y-3 hover:bg-gray-50/50 transition bg-white text-gray-900 border-l-4 ${selectedProductIds.includes(p.id) ? 'border-l-indigo-600 bg-indigo-50/15' : 'border-l-transparent'}`}>
                    <div className="flex items-start gap-3">
                      {/* Selection Checkbox for Touchscreens */}
                      <div className="pt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds(prev => [...prev, p.id]);
                            } else {
                              setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4 text-xs font-semibold"
                        />
                      </div>

                      {/* Image Thumbnail in Mobile */}
                      <div className="w-12 h-12 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=80&q=50";
                            }}
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                        )}
                      </div>

                      <div className="flex-1 flex items-start justify-between gap-3 min-w-0">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-gray-900 text-sm leading-snug">{p.name}</h4>
                            <span className="text-[8px] bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-slate-400 font-bold uppercase tracking-wider shrink-0">
                              {p.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 py-0.5 font-mono text-[9px] text-gray-400">
                            <span>SKU: {p.sku}</span>
                            <span>•</span>
                            <span>Bar: {p.barcode}</span>
                          </div>
                        </div>
                        
                        {/* Price tag */}
                        <div className="text-right shrink-0">
                          <span className="text-sm font-extrabold text-blue-600 font-mono">${p.price.toFixed(2)}</span>
                          <div className="text-[9px] text-gray-400 font-mono text-xs">Cost: ${p.cost.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Location Logistics Details */}
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-150 p-2 text-[10px] font-mono select-none">
                      <div className="flex items-center gap-1 px-1 text-gray-500">
                        <span>Shelf:</span>
                        <strong className="text-gray-800 font-medium">{p.location || 'N/A'}</strong>
                      </div>
                      <div className="flex items-center gap-1 px-1">
                        <span className="text-gray-550">In stock:</span>
                        <strong className={`font-bold ${isOut ? 'text-red-650' : isLow ? 'text-amber-550' : 'text-emerald-600'}`}>
                          {p.quantity} pcs
                        </strong>
                      </div>
                    </div>

                    {/* Stock Alert states info bar */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        {isOut ? (
                          <span className="text-[9px] text-red-650 font-bold flex items-center gap-1 tracking-wider uppercase">
                            <span className="w-1 h-1 rounded-full bg-red-500 animate-ping"></span>
                            EMPTY STOCK (0 pcs)
                          </span>
                        ) : isLow ? (
                          <span className="text-[9px] text-amber-600 font-bold flex items-center gap-1">
                            ⚠️ LOW LEVEL WARNING (Min: {p.minStock})
                          </span>
                        ) : (
                          <span className="text-[9px] text-gray-400">
                            ✓ Steady levels (healthy)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setIsFormOpen(true);
                          }}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 rounded-lg text-[10px] font-bold cursor-pointer transition"
                        >
                          Modify
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1 border border-gray-200 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg cursor-pointer transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center p-12 text-gray-400 italic text-xs bg-white rounded-xl">
                No matching product lists found for input indices.
              </div>
            )}
          </div>

        </div>

      </div>
    );
  };

  // --- Simulated Adaptive Window Shell for preview convenience ---
  const renderAppShellContent = () => {
    return (
      <div className="flex flex-col md:flex-row min-h-[85vh] bg-[#F3F4F6] text-[#111827] font-sans">
        
        {/* Responsive Desktop Side Column */}
        <aside className="hidden md:flex flex-col justify-between w-64 border-r border-slate-700/60 shrink-0 p-5 bg-[#1E293B] text-white">
          <div className="space-y-6">
            
            {/* Operator Tag */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-650 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md shadow-slate-950/40">
                {currentTenantId === 'tenant-apex' ? 'AP' : currentTenantId === 'tenant-nova' ? 'NV' : 'GS'}
              </div>
              <div className="leading-snug min-w-0">
                <h4 className="font-bold text-white text-xs tracking-tight truncate max-w-[130px]">{TENANTS.find(t => t.id === currentTenantId)?.name}</h4>
                <p className="text-[8px] text-slate-450 text-slate-400 uppercase font-extrabold tracking-wider mt-0.5">Tenant Workspace</p>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <div className="space-y-1 overflow-y-auto max-h-[50vh] pr-1 scrollbar-thin scrollbar-thumb-slate-700">
              <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase block pl-3 pb-1 pt-2">AI ADVANCED</span>

              <button
                onClick={() => setActiveTab('copilot')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${activeTab === 'copilot' ? 'bg-indigo-600 text-white font-bold shadow-md' : 'text-indigo-300 hover:text-indigo-200 hover:bg-slate-800/80 border border-indigo-500/15'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-pink-400 animate-pulse" />
                  <span>AI Stock Copilot</span>
                </div>
                <div className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-bold font-mono text-[8.5px] rounded border border-indigo-500/35">
                  LIVE
                </div>
              </button>

              <div className="my-2 border-b border-slate-800/50" />

              <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase block pl-3 pb-1 pt-2">Core Inventory</span>

              <button
                onClick={() => setActiveTab('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${activeTab === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4" />
                  <span>Item Database</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('planner')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${activeTab === 'planner' ? 'bg-blue-600 text-white font-bold' : 'text-slate-415 text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4" />
                  <span>Safety Replenish</span>
                </div>
                {tenantProducts.some(p => p.quantity <= p.minStock) && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('labels')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${activeTab === 'labels' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Printer className="w-4 h-4" />
                  <span>Print Labels</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>

              <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase block pl-3 pb-1 pt-4">Phase 2 Enterprise</span>

              <button
                onClick={() => setActiveTab('procurement')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${activeTab === 'procurement' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Procurement (PO)</span>
                </div>
                {purchaseOrders.some(po => po.approvalRequired && !po.isApproved) && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('count')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${activeTab === 'count' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Cycle Counts</span>
                </div>
                {countSessions.some(count => count.status === 'PENDING_APPROVAL') && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('fulfillment')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${activeTab === 'fulfillment' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4" />
                  <span>Fulfillment Box</span>
                </div>
                {salesOrders.some(so => so.status === 'UNFULFILLED') && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${activeTab === 'analytics' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4" />
                  <span>Webbooks & Reports</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('directory-sso')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${activeTab === 'directory-sso' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Directory & SSO Gate</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${activeTab === 'logs' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>System Audit Logs</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>
            </div>

          </div>

          {/* Sync Box Bottom Panel - Styled Like High Density */}
          <div className="p-4 border-t border-slate-700 bg-slate-900/50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Connection</span>
              <span className={`flex h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-505 animate-pulse bg-emerald-500' : 'bg-amber-500'}`}></span>
            </div>
            <div className="text-[10px] text-slate-400 flex flex-col gap-1.5 font-sans">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <span className={`font-mono font-bold uppercase ${isOnline ? 'text-emerald-400' : 'text-amber-500'}`}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Queue:</span> 
                <span className="font-mono">{syncState.pendingSyncCount} pending</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Synced:</span>
                <span className="font-mono text-[9px] truncate max-w-[120px]" title={syncState.lastSyncedAt || 'Never'}>
                  {syncState.lastSyncedAt ? new Date(syncState.lastSyncedAt).toLocaleTimeString() : 'Never'}
                </span>
              </div>
            </div>
            {syncState.pendingSyncCount > 0 && (
              <button
                onClick={handleSimulateSyncCloud}
                disabled={isSyncing}
                className="w-full mt-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-1 shadow"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>
            )}
          </div>
        </aside>

        {/* Primary Page Workspace Container */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 space-y-6 overflow-y-auto max-h-[85vh] md:max-h-[92vh] bg-[#F3F4F6]">
          {renderTabContent()}
        </main>

        {/* Interactive Bottom Navbar (Only on Mobile Layout) */}
        <nav className="block md:hidden fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-905 bg-slate-900/95 backdrop-blur-md z-30 overflow-x-auto font-sans scrollbar-none">
          <div className="flex items-center gap-6 px-4 py-2.5 min-w-max">
            
            <button
              onClick={() => setActiveTab('copilot')}
              className={`flex flex-col items-center justify-center gap-1 py-0.5 ${activeTab === 'copilot' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
            >
              <Cpu className="w-4 h-4 text-pink-400 animate-pulse" />
              <span className="text-[9px]">Copilot AI</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`flex flex-col items-center justify-center gap-1 py-0.5 ${activeTab === 'all' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
            >
              <Package className="w-4 h-4" />
              <span className="text-[9px]">Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('planner')}
              className={`flex flex-col items-center justify-center gap-1 py-0.5 relative ${activeTab === 'planner' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
            >
              <Activity className="w-4 h-4" />
              {tenantProducts.some(p => p.quantity <= p.minStock) && (
                <span className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
              <span className="text-[9px]">Safety</span>
            </button>

            <button
              onClick={() => setActiveTab('procurement')}
              className={`flex flex-col items-center justify-center gap-1 py-0.5 relative ${activeTab === 'procurement' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
            >
              <ShoppingCart className="w-4 h-4" />
              {purchaseOrders.some(po => po.approvalRequired && !po.isApproved) && (
                <span className="absolute top-0.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
              <span className="text-[9px]">Procure</span>
            </button>

            <button
              onClick={() => setActiveTab('count')}
              className={`flex flex-col items-center justify-center gap-1 py-0.5 relative ${activeTab === 'count' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
            >
              <ClipboardCheck className="w-4 h-4" />
              {countSessions.some(count => count.status === 'PENDING_APPROVAL') && (
                <span className="absolute top-0.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
              <span className="text-[9px]">Counts</span>
            </button>

            <button
              onClick={() => setActiveTab('fulfillment')}
              className={`flex flex-col items-center justify-center gap-1 py-0.5 relative ${activeTab === 'fulfillment' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
            >
              <Truck className="w-4 h-4" />
              {salesOrders.some(so => so.status === 'UNFULFILLED') && (
                <span className="absolute top-0.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              )}
              <span className="text-[9px]">Fulfil</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex flex-col items-center justify-center gap-1 py-0.5 ${activeTab === 'analytics' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-[9px]">API & Reps</span>
            </button>

            <button
              onClick={() => setActiveTab('directory-sso')}
              className={`flex flex-col items-center justify-center gap-1 py-0.5 ${activeTab === 'directory-sso' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="text-[9px]">SSO & RBAC</span>
            </button>

            <button
              onClick={() => setActiveTab('labels')}
              className={`flex flex-col items-center justify-center gap-1 py-0.5 ${activeTab === 'labels' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
            >
              <Printer className="w-4 h-4" />
              <span className="text-[9px]">Labels</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex flex-col items-center justify-center gap-1 py-0.5 ${activeTab === 'logs' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-[9px]">Logs</span>
            </button>

          </div>
        </nav>

      </div>
    );
  };

  if (showLandingPage) {
    return (
      <ProductLandingSite
        onEnterDemo={(role, tenantId) => {
          setCurrentRole(role);
          setCurrentTenantId(tenantId);
          setShowLandingPage(false);
          showNotification(`Demo Session Activated: Operating as ${role} for ${TENANTS.find(t => t.id === tenantId)?.name}!`, 'success');
        }}
        onEnterQuick={() => {
          setShowLandingPage(false);
          showNotification('Entered sandbox mode with default profile credentials.', 'info');
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark text-slate-100' : 'text-slate-900'} bg-slate-50/80 flex flex-col font-sans select-none antialiased selection:bg-indigo-600 selection:text-white`}>
      
      {/* Universal Top Header Bar (Status & Device Simulator Control) */}
      <header className="px-4 sm:px-6 py-3 border-b border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-xs">
        
        {/* Left Side: Brand name & Tenant switcher */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-900 text-white font-black rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs font-mono">
              <span>LOGILEDGER</span>
            </span>
          </div>

          <button
            onClick={() => {
              setShowLandingPage(true);
              showNotification('Redirected to the Product Explainer and features portal.', 'info');
            }}
            className="px-2.5 py-1 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-[10px] flex items-center gap-1 bg-slate-50 transition cursor-pointer"
            title="Return to the feature list design details and tour site"
          >
            <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
            <span>Product Tour Site</span>
          </button>

          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="px-2.5 py-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-250 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg text-[10px] flex items-center gap-1 bg-emerald-50/30 transition cursor-pointer font-sans"
            title="Wizard configuration guide and automated unit test suite"
          >
            <HelpCircle className="w-3 h-3 text-emerald-500 animate-pulse" />
            <span>Setup & Test Wizard</span>
          </button>

          <div className="h-5 w-px bg-gray-200 hidden sm:block" />

          {/* Tenant Dropdown */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-xl">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider hidden lg:inline font-sans">Merchant Profile:</span>
            <select
              value={currentTenantId}
              onChange={(e) => {
                setCurrentTenantId(e.target.value);
                showNotification(`Pivoted dashboard context to: ${TENANTS.find(t => t.id === e.target.value)?.name}`, 'info');
              }}
              className="bg-transparent text-gray-900 text-xs font-bold border-none outline-none cursor-pointer focus:ring-0 py-0.5 leading-tight font-sans"
            >
              {TENANTS.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          
          <div className="hidden sm:flex items-center gap-1 text-[9px] text-gray-500 ml-2 border-l border-gray-200 pl-4 font-mono">
            <span className={isOnline ? 'text-emerald-550' : 'text-amber-600'}>
              ●
            </span>
            <span>Ledger:</span>
            <strong className={isOnline ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{isOnline ? 'CLOUD SYNC' : 'LOCAL LEDGER'}</strong>
          </div>
        </div>

        {/* Right Side: Visual simulator settings */}
        <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto font-sans">
          
          {/* Simulate Force Offline / Online button - Perfect value verification */}
          <button
            onClick={toggleOnlineMode}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 cursor-pointer hover:shadow transition duration-150 ${isOnline ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/50'}`}
            title="Click to toggle simulated internet connection to verify offline state ledger behaviour"
          >
            {isOnline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'Simulate Offline' : 'Go Online'}</span>
          </button>

          {/* Device simulator size slider toggles */}
          <div className="hidden md:flex bg-gray-100 border border-gray-200 p-0.5 rounded-xl text-[10px] font-bold select-none text-gray-500">
            <button
              onClick={() => setDeviceLayout('responsive')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition ${deviceLayout === 'responsive' ? 'bg-blue-600 text-white' : 'hover:text-gray-800'}`}
            >
              <span>Auto Adaptive</span>
            </button>
            <button
              onClick={() => setDeviceLayout('mobile-sim')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${deviceLayout === 'mobile-sim' ? 'bg-blue-600 text-white shadow-sm' : 'hover:text-gray-800'}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Simulate Mobile App</span>
            </button>
            <button
              onClick={() => setDeviceLayout('desktop-sim')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${deviceLayout === 'desktop-sim' ? 'bg-blue-600 text-white shadow-sm' : 'hover:text-gray-800'}`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Simulate Desktop App</span>
            </button>
          </div>

          {/* Visual Notification Bell Icon & Dropdown Alert System */}
          <div className="relative">
            <button
              onClick={() => setIsAlertDropdownOpen(!isAlertDropdownOpen)}
              id="alert-center-toggle"
              className="p-2 relative border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer flex items-center justify-center shadow-xs shrink-0"
              title="Stock Alert & Threshold Warning Center"
            >
              {stockAlerts.filter(a => !a.isRead && (!a.tenantId || a.tenantId === currentTenantId)).length > 0 ? (
                <>
                  <BellRing className="w-4 h-4 text-red-500 animate-[bounce_1.5s_infinite]" />
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-1 flex items-center justify-center bg-red-500 text-white text-[8px] font-black rounded-full shadow-xs border border-white dark:border-slate-800">
                    {stockAlerts.filter(a => !a.isRead && (!a.tenantId || a.tenantId === currentTenantId)).length}
                  </span>
                </>
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </button>

            {isAlertDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-45 bg-transparent" 
                  onClick={() => setIsAlertDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2.5 w-80 md:w-96 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3 border-b border-gray-150 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Logistics Threshold Alerts
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {stockAlerts.filter(a => !a.tenantId || a.tenantId === currentTenantId).length > 0 && (
                        <button
                          onClick={() => {
                            setStockAlerts(prev => prev.map(a => (!a.tenantId || a.tenantId === currentTenantId) ? { ...a, isRead: true } : a));
                            showNotification("All tenant threshold alerts marked as read.", "info");
                          }}
                          className="text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                      {stockAlerts.filter(a => !a.tenantId || a.tenantId === currentTenantId).length > 0 && (
                        <button
                          onClick={() => {
                            setStockAlerts(prev => prev.filter(a => a.tenantId !== currentTenantId && a.tenantId !== undefined));
                            showNotification("Cleared tenant alerts history.", "info");
                          }}
                          className="text-[9px] font-bold text-red-500 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/80">
                    {stockAlerts.filter(a => !a.tenantId || a.tenantId === currentTenantId).length === 0 ? (
                      <div className="py-8 px-4 text-center text-slate-400 dark:text-slate-500">
                        <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-650 mx-auto mb-2" />
                        <p className="text-xs font-medium">No active threshold warnings</p>
                        <p className="text-[10px] text-slate-400 mt-1">Updates trigger alerts when stock falls below limit</p>
                      </div>
                    ) : (
                      stockAlerts.filter(a => !a.tenantId || a.tenantId === currentTenantId).map(alert => {
                        const productRef = products.find(p => p.id === alert.productId);
                        return (
                          <div
                            key={alert.id}
                            className={`p-3 transition-colors ${
                              alert.isRead 
                                ? 'bg-white dark:bg-slate-900 opacity-75' 
                                : 'bg-red-50/20 dark:bg-red-950/10 border-l-2 border-red-500'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    alert.type === 'out_of_stock' 
                                      ? 'bg-red-500 animate-ping' 
                                      : 'bg-amber-500'
                                  }`} />
                                  <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 font-mono">
                                    {alert.sku}
                                  </span>
                                  <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                    alert.type === 'out_of_stock'
                                      ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                                      : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                                  }`}>
                                    {alert.type === 'out_of_stock' ? 'STOCKOUT' : 'LOW STOCK'}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-1">
                                  {alert.productName}
                                </h4>
                                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                                  Stock: <strong className="text-slate-755 dark:text-slate-200">{alert.currentQty}</strong> unit{alert.currentQty === 1 ? '' : 's'} (Safety threshold: {alert.minStock})
                                </p>
                                <p className="text-[8px] text-slate-400 font-mono mt-1">
                                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <button
                                  onClick={() => {
                                    setStockAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, isRead: true } : a));
                                  }}
                                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                                  title="Mark as read"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                {productRef && (
                                  <button
                                    onClick={() => {
                                      handleRestockOrder(productRef);
                                      setStockAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, isRead: true } : a));
                                      showNotification(`Dispatched supplier restock request for: "${alert.productName}"`, 'success');
                                    }}
                                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 border border-blue-650 text-white text-[8px] font-extrabold rounded-lg flex items-center gap-1 cursor-pointer select-none transition"
                                  >
                                    <ShoppingCart className="w-2.5 h-2.5" />
                                    <span>Restock</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Theme switcher toggle */}
          <button
            onClick={() => {
              const newTheme = theme === 'light' ? 'dark' : 'light';
              setTheme(newTheme);
              showNotification(`Switched interface theme preference to standard ${newTheme.toUpperCase()} mode.`, 'info');
            }}
            id="theme-switcher-toggle"
            className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
            title={`Toggle ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500 animate-[pulse_3s_infinite]" />
                <span className="text-[10px] font-bold">Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500 animate-[spin_12s_linear_infinite]" />
                <span className="text-[10px] font-bold">Light Mode</span>
              </>
            )}
          </button>

          {/* Google Auth Status / Actions Panel */}
          {user ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 font-sans text-white">
              {user.photoURL ? (
                <img src={user.photoURL} referrerPolicy="no-referrer" className="w-5 h-5 rounded-full object-cover border border-indigo-500" alt="avatar" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] font-bold text-white uppercase select-none">
                  {user.displayName?.charAt(0) || 'O'}
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold text-slate-200 truncate max-w-[85px] leading-snug">{user.displayName || 'Operator'}</span>
                <button onClick={() => signOut(auth)} className="text-[8px] text-slate-400 hover:text-red-400 font-semibold cursor-pointer text-left leading-none mt-0.5">Sign Out</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => signInWithPopup(auth, googleProvider)}
              className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-250 text-gray-700 text-[10px] font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              title="Sign in with your Google Account to test remote Firestore cloud syncing features"
            >
              <User className="w-3.5 h-3.5 text-blue-650" />
              <span>Connect Cloud</span>
            </button>
          )}

          {/* Direct trigger scanner laser FAB */}
          <button
            onClick={() => setIsScannerOpen(true)}
            id="scanner-launcher-fab"
            className="px-4.5 py-1.5 bg-blue-600 hover:bg-blue-750 border border-blue-650 text-white text-[10px] font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/10 active:scale-95 transition"
          >
            <Barcode className="w-4 h-4 animate-pulse" />
            <span>Launch Scanner</span>
          </button>

        </div>
      </header>

      {/* Outer Banner alerts info */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 md:right-8 z-55 flex items-center gap-3.5 px-4.5 py-3 font-sans rounded-2xl bg-slate-900/90 border border-slate-750 backdrop-blur-md shadow-xl text-white"
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : notification.type === 'warning' ? (
              <WifiOff className="w-5 h-5 text-amber-500 animate-pulse" />
            ) : (
              <CloudLightning className="w-5 h-5 text-blue-400" />
            )}
            <p className="text-xs text-slate-200 font-semibold">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Immediate Low-Stock Toast Alerts Portal */}
      <div className="fixed bottom-6 right-6 z-55 flex flex-col gap-3.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {activeToastAlerts.map(toast => {
            const productRef = products.find(p => p.id === toast.productId);
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="pointer-events-auto w-full bg-slate-950/95 dark:bg-slate-900 border border-red-550/45 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-white flex gap-3.5 font-sans relative"
              >
                <div className="shrink-0 w-9 h-9 rounded-full bg-red-550/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className="text-[8px] bg-red-500/20 text-red-300 border border-red-500/30 font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    {toast.type === 'out_of_stock' ? 'CRITICAL STOCKOUT' : 'THRESHOLD REACHED'}
                  </span>
                  
                  <h4 className="text-xs font-black text-slate-100 truncate mt-2">
                    {toast.productName}
                  </h4>
                  
                  <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">
                    {toast.type === 'out_of_stock'
                      ? 'Item is completely depleted on active logistical inventory shelves.'
                      : `Inventory has reached its minimum safety margin balance!`}
                  </p>
                  
                  <p className="text-xs text-slate-100 mt-2 font-medium flex items-center gap-1.5">
                    <span>On Hand:</span>
                    <strong className="text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded text-xs leading-none">{toast.currentQty}</strong>
                    <span className="text-slate-500 text-[10px]">/ Safety limit: {toast.minStock}</span>
                  </p>
                  
                  {productRef && (
                    <button
                      onClick={() => {
                        handleRestockOrder(productRef);
                        setActiveToastAlerts(prev => prev.filter(t => t.id !== toast.id));
                        setStockAlerts(prev => prev.map(a => a.productId === toast.productId ? { ...a, isRead: true } : a));
                        showNotification(`Dispatched instant restock request for ${toast.productName}!`, 'success');
                      }}
                      className="mt-3 w-full py-1.5 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition select-none shadow-sm hover:shadow-red-950/40"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      <span>Order Restock Buffer (+{(toast.minStock - toast.currentQty) + 15} Qty)</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setActiveToastAlerts(prev => prev.filter(t => t.id !== toast.id));
                  }}
                  className="absolute top-3.5 right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Simulator Frame Wrapper */}
      <div className={`flex-1 flex justify-center items-center ${deviceLayout === 'responsive' ? 'p-0' : 'p-4'} overflow-hidden relative`}>
        <AnimatePresence mode="wait">
          
          {/* SIMULATED MOBILE DEVICE SHELL CONTAINER */}
          {deviceLayout === 'mobile-sim' ? (
            <motion.div
              key="mobile-shell"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-[375px] h-[720px] bg-slate-950 border-[10px] border-slate-900 rounded-[48px] shadow-[0_0_40px_#000] overflow-hidden flex flex-col pt-4 pb-2"
            >
              {/* Phone Head Speaker / Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-4.5 bg-slate-900 rounded-full flex items-center justify-center gap-2 z-40 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-800 shrink-0" />
                <span className="w-14 h-1 bg-slate-800 rounded-full" />
              </div>
              
              {/* In-Phone Screen Space */}
              <div className="flex-1 flex flex-col overflow-y-auto pb-14 font-sans select-none [&_aside]:hidden [&_table]:hidden md:[&_table]:hidden [&_thead]:hidden [&_tr]:border-none [&_td]:p-0">
                
                {/* Mobile Specific Header */}
                <div className="px-4 py-3 border-b border-slate-850 bg-slate-950 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                      <Warehouse className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-slate-100 text-xs">Retail Mobile App</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[8px] font-mono text-slate-500">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-500'}`} />
                    <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                  </div>
                </div>

                {/* Main Content Workspace */}
                <div className="p-3 space-y-4">
                  {renderTabContent()}
                </div>

                {/* Mobile Shell Fixed Bottom Nav */}
                <nav className="absolute bottom-2 left-2 right-2 border border-slate-850 bg-slate-900/90 backdrop-blur-md rounded-2xl z-40">
                  <div className="grid grid-cols-4 py-1.5 text-center">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`text-[9px] font-bold flex flex-col items-center justify-center gap-1 ${activeTab === 'all' ? 'text-indigo-400' : 'text-slate-500'}`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Items</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('planner')}
                      className={`text-[9px] font-bold flex flex-col items-center justify-center gap-1 relative ${activeTab === 'planner' ? 'text-indigo-400' : 'text-slate-500'}`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      {products.some(p => p.quantity <= p.minStock) && (
                        <span className="absolute top-1 right-5 w-1.5 h-1.5 rounded-full bg-red-400" />
                      )}
                      <span>Planner</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('logs')}
                      className={`text-[9px] font-bold flex flex-col items-center justify-center gap-1 ${activeTab === 'logs' ? 'text-indigo-400' : 'text-slate-500'}`}
                    >
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Logs</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('copilot')}
                      className={`text-[9px] font-bold flex flex-col items-center justify-center gap-1 ${activeTab === 'copilot' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
                    >
                      <Cpu className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                      <span>Copilot AI</span>
                    </button>
                  </div>
                </nav>
              </div>

              {/* Phone bottom bar */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-700 rounded-full select-none z-40" />
            </motion.div>
          ) : deviceLayout === 'desktop-sim' ? (
            
            // SIMULATED DESKTOP PC MONITOR VIEW
            <motion.div
              key="desktop-shell"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-6xl h-[650px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative"
            >
              {/* Window controls header mock */}
              <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-850 flex items-center justify-between select-none shrink-0">
                <div className="flex gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                </div>
                <div className="text-[10px] font-semibold text-slate-500 font-mono">
                  https://inventory.retailstore.com/admin/dashboard
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <User className="w-3 h-3 text-indigo-400" />
                  <span>Admin Terminal</span>
                </div>
              </div>

              {/* Window Interior Content */}
              <div className="flex-1 overflow-hidden">
                {renderAppShellContent()}
              </div>
            </motion.div>
          ) : (
            // STANDARD FLUID AUTOMATIC RESPONSIVE LAYOUT
            <motion.div
              key="responsive-shell"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              {renderAppShellContent()}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* MODAL DRAWERS OVERLAYS */}
      <AnimatePresence>
        {isFormOpen && (
          <ProductForm
            product={selectedProduct}
            categories={categories}
            onAddCategory={handleCreateCategory}
            onSave={handleSaveProduct}
            existingProducts={tenantProducts}
            onClose={() => {
              setIsFormOpen(false);
              setSelectedProduct(null);
            }}
          />
        )}

        {isScannerOpen && (
          <BarcodeScanner
            productsList={products}
            onScanSuccess={handleBarcodeScanned}
            onClose={() => setIsScannerOpen(false)}
          />
        )}

        {isOnboardingOpen && (
          <OnboardingWizard
            isOpen={isOnboardingOpen}
            onClose={() => {
              setIsOnboardingOpen(false);
              localStorage.setItem('logiledger_onboarding_completed_v1', 'true');
            }}
            currentTenantId={currentTenantId}
            setCurrentTenantId={setCurrentTenantId}
            products={products}
            categories={categories}
            saveLocalProduct={handleSaveProduct}
            addCategory={handleCreateCategory}
            showNotification={showNotification}
            triggerSync={handleSimulateSyncCloud}
            isOnline={isOnline}
            theme={theme}
          />
        )}
      </AnimatePresence>
      
      {/* Absolute Bottom Developer Footer */}
      <footer className="py-2.5 px-6 border-t border-gray-200 text-[10px] text-gray-400 bg-white hidden md:flex items-center justify-between flex-col md:flex-row gap-2 shrink-0 select-none">
        <div>
          <span>Database Host: Built-in secure index stack</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Client: React Router SPA</span>
          <span>•</span>
          <span>Scanner Engine: HTML5 QR Code program</span>
        </div>
      </footer>

    </div>
  );
}
