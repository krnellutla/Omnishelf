import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Product, Category } from '../types';

// Mock localStorage for Node.js Vitest environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Import localDB utilities dynamically so localStorage setup is complete
import {
  getLocalProducts,
  saveLocalProduct,
  initializeLocalDB,
  createLocalTransaction,
  getLocalTransactions
} from './localDB';

describe('LogiLedger DB ACID Compliance & Engine Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    // Re-initialize for each test
    initializeLocalDB();
  });

  it('correctly initializes with default system products and categories', () => {
    const products = getLocalProducts();
    expect(products.length).toBeGreaterThan(0);
    
    const prod1 = products.find(p => p.id === 'prod-001');
    expect(prod1).toBeDefined();
    expect(prod1?.name).toBe('Wireless Earbuds Pro');
    expect(prod1?.sku).toBe('ELE-EAR-001');
  });

  it('successfully persists and retrieves a new custom product', () => {
    const customProduct: Product = {
      id: 'prod-test-999',
      name: 'Super Quantum Charger',
      barcode: '1234567890123',
      sku: 'ELE-QTY-999',
      category: 'Electronics',
      price: 29.99,
      cost: 15.00,
      quantity: 10,
      minStock: 2,
      supplier: 'FutureTech Corp',
      location: 'Warehouse Back Shelf',
      updatedAt: new Date().toISOString(),
      createdBy: 'tester-user',
      tenantId: 'tenant-apex'
    };

    saveLocalProduct(customProduct, 'Initial Stock Receipt');

    const products = getLocalProducts();
    const retrieved = products.find(p => p.id === 'prod-test-999');
    
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Super Quantum Charger');
    expect(retrieved?.quantity).toBe(10);
  });

  it('automatically triggers structured ledger transactional records on inventory quantity balance adjustments', () => {
    const initialProduct: Product = {
      id: 'prod-test-888',
      name: 'Micro USB Cable',
      barcode: '8887776665554',
      sku: 'ELE-USB-888',
      category: 'Electronics',
      price: 5.99,
      cost: 2.00,
      quantity: 50,
      minStock: 10,
      supplier: 'Generic Corp',
      location: 'Warehouse A',
      updatedAt: new Date().toISOString(),
      createdBy: 'tester-user',
      tenantId: 'tenant-apex'
    };

    // Save initial product (adds 50 units, starts at 0 -> 50)
    saveLocalProduct(initialProduct, 'Initial restock');

    const transactions = getLocalTransactions();
    const relevantTX = transactions.filter(t => t.productId === 'prod-test-888');
    
    expect(relevantTX.length).toBeGreaterThan(0);
    expect(relevantTX[0].type).toBe('IN');
    expect(relevantTX[0].quantityChanged).toBe(50);
  });

  it('correctly calculates delta adjustments for outgoing sales shipments', () => {
    const initialProduct: Product = {
      id: 'prod-test-555',
      name: 'Titanium Bolts',
      barcode: '5552223334441',
      sku: 'MET-BLT-555',
      category: 'Hardware',
      price: 4.50,
      cost: 1.20,
      quantity: 100,
      minStock: 20,
      supplier: 'Apex Metallurgy',
      location: 'Row C-3',
      updatedAt: new Date().toISOString(),
      createdBy: 'tester-user',
      tenantId: 'tenant-apex'
    };

    saveLocalProduct(initialProduct, 'Receipt');

    // Reduce stock to represent shipping item out
    const updatedProduct = { ...initialProduct, quantity: 80 };
    saveLocalProduct(updatedProduct, 'Outbound Order Fulfilled');

    const txs = getLocalTransactions();
    const shipTX = txs.find(t => t.productId === 'prod-test-555' && t.type === 'OUT');
    
    expect(shipTX).toBeDefined();
    expect(shipTX?.quantityChanged).toBe(20);
    expect(shipTX?.newQuantity).toBe(80);
    expect(shipTX?.reason).toBe('Outbound Order Fulfilled');
  });
});
