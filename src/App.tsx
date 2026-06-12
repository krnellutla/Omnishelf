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
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Firebase & Auth Integrations
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, query, where, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, googleProvider, signInWithPopup, signOut, OperationType, handleFirestoreError } from './utils/firebase';

// Models & API Types
import { Product, Category, Transaction, SyncState } from './types';
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

export default function App() {
  // --- Core States ---
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [currentTenantId, setCurrentTenantId] = useState<string>('tenant-apex');

  const tenantProducts = products.filter(p => p.tenantId === currentTenantId || (!p.tenantId && currentTenantId === 'tenant-apex'));
  const tenantTransactions = transactions.filter(t => t.tenantId === currentTenantId || (!t.tenantId && currentTenantId === 'tenant-apex'));
  
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
  const [activeTab, setActiveTab] = useState<'all' | 'planner' | 'logs' | 'labels'>('all');

  // --- Filtering & Selection ---
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockLevelFilter, setStockLevelFilter] = useState<'ALL' | 'LOW' | 'IN_STOCK' | 'OUT'>('ALL');
  
  // --- Modal Controllers ---
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // --- Notification Banner ---
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

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
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
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
      case 'planner':
        return <InventoryStats products={tenantProducts} onRestockClick={handleRestockOrder} forceMobile={forceMobile} />;
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

        {/* Database Grid Container */}
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-xs">
          
          {/* Main Table for Desktop view */}
          <div className={`${forceMobile ? 'hidden' : 'hidden md:block'} overflow-x-auto`}>
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[10px] uppercase tracking-wider font-extrabold text-gray-500 text-center">
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
                      <tr key={p.id} className="hover:bg-gray-50/50 transition border-b border-gray-105 border-gray-105/40 text-gray-900">
                        {/* Name & Barcode */}
                        <td className="py-3.5 px-4 font-sans">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-955 text-gray-900 text-sm">{p.name}</span>
                            <span className="font-mono text-[9px] text-gray-400 mt-1 flex items-center gap-1.5">
                              <span>SKU: <strong className="text-gray-600 font-normal">{p.sku}</strong></span>
                              <span>•</span>
                              <span>Bar: <strong className="text-blue-600 font-normal cursor-pointer select-all hover:underline" title="Click to copy barcode" onClick={() => {
                                navigator.clipboard.writeText(p.barcode);
                                showNotification('Barcode copied to clipboard!', 'info');
                              }}>{p.barcode}</strong></span>
                            </span>
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
                    <td colSpan={8} className="py-12 text-center space-y-2">
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
                  <div key={p.id} className="p-4 space-y-3 hover:bg-gray-50/50 transition bg-white text-gray-900">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-gray-900 text-sm leading-snug">{p.name}</h4>
                          <span className="text-[8px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-bold uppercase tracking-wider shrink-0">
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
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${activeTab === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4" />
                  <span>Item Database</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('planner')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${activeTab === 'planner' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4" />
                  <span>Replenish Planner</span>
                </div>
                {tenantProducts.some(p => p.quantity <= p.minStock) && (
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${activeTab === 'logs' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>Audit Logs</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('labels')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${activeTab === 'labels' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Printer className="w-4 h-4" />
                  <span>Interactive Labels</span>
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
        <nav className="block md:hidden fixed bottom-0 left-0 right-0 border-t border-slate-850 bg-slate-950/95 backdrop-blur-md z-30">
          <div className="grid grid-cols-4 py-2">
            
            <button
              onClick={() => setActiveTab('all')}
              className={`flex flex-col items-center justify-center gap-1.5 py-1 ${activeTab === 'all' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
            >
              <Package className="w-4 h-4" />
              <span className="text-[9px]">Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('planner')}
              className={`flex flex-col items-center justify-center gap-1.5 py-1 relative ${activeTab === 'planner' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
            >
              <Activity className="w-4 h-4" />
              {tenantProducts.some(p => p.quantity <= p.minStock) && (
                <span className="absolute top-1 right-6 w-1.5 h-1.5 rounded-full bg-red-400" />
              )}
              <span className="text-[9px]">Planner</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex flex-col items-center justify-center gap-1.5 py-1 ${activeTab === 'logs' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-[9px]">Audits</span>
            </button>

            <button
              onClick={() => setActiveTab('labels')}
              className={`flex flex-col items-center justify-center gap-1.5 py-1 ${activeTab === 'labels' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
            >
              <Printer className="w-4 h-4" />
              <span className="text-[9px]">Labels</span>
            </button>

          </div>
        </nav>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#111827] flex flex-col font-sans select-none antialiased selection:bg-blue-650 selection:text-white">
      
      {/* Universal Top Header Bar (Status & Device Simulator Control) */}
      <header className="px-4 sm:px-6 py-3 border-b border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-xs">
        
        {/* Left Side: Brand name & Tenant switcher */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-900 text-white font-black rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs font-mono">
              <span>OMNISHELF</span>
            </span>
          </div>

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
            className="fixed top-20 right-4 md:right-8 z-50 flex items-center gap-3.5 px-4.5 py-3 font-sans rounded-2xl bg-slate-900/90 border border-slate-750 backdrop-blur-md shadow-xl text-white"
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
                      onClick={() => setActiveTab('labels')}
                      className={`text-[9px] font-bold flex flex-col items-center justify-center gap-1 ${activeTab === 'labels' ? 'text-indigo-400' : 'text-slate-500'}`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Labels</span>
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
