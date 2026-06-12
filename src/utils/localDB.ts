/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Transaction, Category } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'retail_inventory_products',
  TRANSACTIONS: 'retail_inventory_transactions',
  CATEGORIES: 'retail_inventory_categories',
  PENDING_SYNC: 'retail_inventory_pending_sync',
  LAST_SYNC: 'retail_inventory_last_sync'
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics', description: 'Gadgets, chargers, and tech accessories', createdBy: 'system' },
  { id: '2', name: 'Apparel', description: 'Clothing, footwear, and accessories', createdBy: 'system' },
  { id: '3', name: 'Home & Kitchen', description: 'Furniture, utensils, and home decor', createdBy: 'system' },
  { id: '4', name: 'Grocery & Drinks', description: 'Coffee beans, snacks, and stable pantry items', createdBy: 'system' },
  { id: '5', name: 'Sports & Outdoors', description: 'Fitness gear, bottles, and camping equipment', createdBy: 'system' }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Wireless Earbuds Pro',
    barcode: '4006381333931',
    sku: 'ELE-EAR-001',
    category: 'Electronics',
    price: 89.99,
    cost: 45.00,
    quantity: 14,
    minStock: 5,
    supplier: 'Vertex Digital Ltd',
    location: 'Aisle A, Shelf 2',
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    tenantId: 'tenant-apex'
  },
  {
    id: 'prod-002',
    name: 'Ergonomic Office Chair',
    barcode: '9780201379624',
    sku: 'FUR-CHR-002',
    category: 'Home & Kitchen',
    price: 249.00,
    cost: 110.05,
    quantity: 3, // Low stock! (min is 5)
    minStock: 5,
    supplier: 'ComfortZone Furniture Corp',
    location: 'Aisle F, Row 4',
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    tenantId: 'tenant-nova'
  },
  {
    id: 'prod-003',
    name: 'Stainless Steel Water Bottle',
    barcode: '049000000443',
    sku: 'SPO-WTR-003',
    category: 'Sports & Outdoors',
    price: 24.50,
    cost: 10.00,
    quantity: 52,
    minStock: 12,
    supplier: 'Apex Outdoors Wholesale',
    location: 'Aisle C, Shelf 1',
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    tenantId: 'tenant-apex'
  },
  {
    id: 'prod-004',
    name: 'Organic Coffee Beans (1kg)',
    barcode: '5010251731118',
    sku: 'GRO-COF-004',
    category: 'Grocery & Drinks',
    price: 18.00,
    cost: 7.50,
    quantity: 7, // Low stock! (min is 15)
    minStock: 15,
    supplier: 'Andes Direct Importers',
    location: 'Aisle D, Shelf 3',
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    tenantId: 'tenant-greensprout'
  },
  {
    id: 'prod-005',
    name: 'USB-C Fast Charger (30W)',
    barcode: '792823522201',
    sku: 'ELE-CHG-005',
    category: 'Electronics',
    price: 19.95,
    cost: 6.80,
    quantity: 48,
    minStock: 10,
    supplier: 'Vertex Digital Ltd',
    location: 'Aisle A, Shelf 4',
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    tenantId: 'tenant-apex'
  },
  {
    id: 'prod-006',
    name: 'Vintage Denim Jacket',
    barcode: '883412345678',
    sku: 'APP-JKT-006',
    category: 'Apparel',
    price: 75.00,
    cost: 32.00,
    quantity: 1, // Criticially Low stock!
    minStock: 4,
    supplier: 'EcoThread Apparel Co',
    location: 'Apparel Rack 2',
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    tenantId: 'tenant-nova'
  }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-001',
    productId: 'prod-001',
    productName: 'Wireless Earbuds Pro',
    type: 'IN',
    quantityChanged: 10,
    previousQuantity: 4,
    newQuantity: 14,
    reason: 'Restock from Vertex Digital Ltd',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    userId: 'system',
    tenantId: 'tenant-apex'
  },
  {
    id: 'tx-002',
    productId: 'prod-003',
    productName: 'Stainless Steel Water Bottle',
    type: 'OUT',
    quantityChanged: 3,
    previousQuantity: 55,
    newQuantity: 52,
    reason: 'Counter Sale (Tx #9812)',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    userId: 'system',
    tenantId: 'tenant-apex'
  },
  {
    id: 'tx-003',
    productId: 'prod-004',
    productName: 'Organic Coffee Beans (1kg)',
    type: 'OUT',
    quantityChanged: 1,
    previousQuantity: 8,
    newQuantity: 7,
    reason: 'Store sample tasting / demo',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    userId: 'system',
    tenantId: 'tenant-greensprout'
  }
];

// Helper to check if local storage has data, initialize if not
export function initializeLocalDB() {
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
  } else {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    let modified = false;
    existing.forEach((p: any) => {
      if (!p.tenantId) {
        if (p.category === 'Electronics' || p.category === 'Sports & Outdoors') {
          p.tenantId = 'tenant-apex';
        } else if (p.category === 'Apparel' || p.category === 'Home & Kitchen') {
          p.tenantId = 'tenant-nova';
        } else {
          p.tenantId = 'tenant-greensprout';
        }
        modified = true;
      }
    });
    if (modified) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(existing));
    }
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(DEFAULT_TRANSACTIONS));
  } else {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
    let modified = false;
    existing.forEach((t: any) => {
      if (!t.tenantId) {
        t.tenantId = 'tenant-apex';
        modified = true;
      }
    });
    if (modified) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(existing));
    }
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
  }
}

// Products API
export function getLocalProducts(): Product[] {
  initializeLocalDB();
  const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  return raw ? JSON.parse(raw) : [];
}

export function saveLocalProduct(product: Product, reason?: string): Product {
  const products = getLocalProducts();
  const existingIndex = products.findIndex(p => p.id === product.id);
  const curTime = new Date().toISOString();
  
  const updatedProduct = {
    ...product,
    updatedAt: curTime
  };

  let previousQty = 0;
  if (existingIndex >= 0) {
    previousQty = products[existingIndex].quantity;
    products[existingIndex] = updatedProduct;
  } else {
    products.push(updatedProduct);
  }

  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

  // If quantity changed, automatically record a transaction
  const qtyDiff = updatedProduct.quantity - previousQty;
  if (qtyDiff !== 0) {
    createLocalTransaction({
      id: `tx-${Math.random().toString(36).substr(2, 9)}`,
      productId: updatedProduct.id,
      productName: updatedProduct.name,
      type: qtyDiff > 0 ? 'IN' : 'OUT',
      quantityChanged: Math.abs(qtyDiff),
      previousQuantity: previousQty,
      newQuantity: updatedProduct.quantity,
      reason: reason || (qtyDiff > 0 ? 'Manual Stock In' : 'Manual Stock Out'),
      timestamp: curTime,
      userId: 'offline-user',
      tenantId: updatedProduct.tenantId
    });
  }

  queueSyncOperation('PRODUCT_SAVE', updatedProduct.id);
  return updatedProduct;
}

export function deleteLocalProduct(id: string) {
  const products = getLocalProducts();
  const filtered = products.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
  queueSyncOperation('PRODUCT_DELETE', id);
}

// Transactions API
export function getLocalTransactions(): Transaction[] {
  initializeLocalDB();
  const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  return raw ? JSON.parse(raw) : [];
}

export function createLocalTransaction(transaction: Transaction): Transaction {
  const transactions = getLocalTransactions();
  transactions.unshift(transaction); // add to top
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  
  queueSyncOperation('TRANSACTION_LOG', transaction.id);
  return transaction;
}

// Categories API
export function getLocalCategories(): Category[] {
  initializeLocalDB();
  const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  return raw ? JSON.parse(raw) : [];
}

export function saveLocalCategory(category: Category): Category {
  const categories = getLocalCategories();
  const idx = categories.findIndex(c => c.id === category.id);
  
  if (idx >= 0) {
    categories[idx] = category;
  } else {
    categories.push(category);
  }

  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  queueSyncOperation('CATEGORY_SAVE', category.id);
  return category;
}

export function deleteLocalCategory(id: string) {
  const categories = getLocalCategories();
  const filtered = categories.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
  queueSyncOperation('CATEGORY_DELETE', id);
}

// Queue system for cloud sync
interface QueueItem {
  id: string;
  action: string;
  targetId: string;
  timestamp: string;
}

function queueSyncOperation(action: string, targetId: string) {
  const queue: QueueItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || '[]');
  
  // To avoid duplicate sync actions for same target, check if we can consolidate
  const existingIdx = queue.findIndex(q => q.targetId === targetId && q.action === action);
  if (existingIdx >= 0) {
    queue[existingIdx].timestamp = new Date().toISOString();
  } else {
    queue.push({
      id: `sync-${Math.random().toString(36).substr(2, 9)}`,
      action,
      targetId,
      timestamp: new Date().toISOString()
    });
  }
  
  localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(queue));
}

export function getPendingSyncCount(): number {
  const queue: QueueItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || '[]');
  return queue.length;
}

export function clearPendingSync() {
  localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, '[]');
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
}

export function getLastSyncedTime(): string | null {
  return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
}
