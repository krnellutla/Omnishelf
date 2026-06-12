/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, InventoryStats as StatsType } from '../types';
import { Package, TrendingUp, AlertTriangle, Landmark, Percent, ShoppingCart, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface InventoryStatsProps {
  products: Product[];
  onRestockClick: (product: Product) => void;
  forceMobile?: boolean;
}

export default function InventoryStats({ products, onRestockClick, forceMobile }: InventoryStatsProps) {
  // Compute Stats
  const stats: StatsType = products.reduce(
    (acc, prod) => {
      acc.totalItems += 1;
      acc.totalQuantity += prod.quantity;
      acc.totalValueCost += prod.cost * prod.quantity;
      acc.totalValueRetail += prod.price * prod.quantity;
      if (prod.quantity <= prod.minStock) {
        acc.lowStockCount += 1;
      }
      return acc;
    },
    {
      totalItems: 0,
      totalQuantity: 0,
      totalValueCost: 0,
      totalValueRetail: 0,
      lowStockCount: 0
    }
  );

  const potentialProfit = stats.totalValueRetail - stats.totalValueCost;
  const averageMargin = stats.totalValueRetail > 0 
    ? (potentialProfit / stats.totalValueRetail) * 100 
    : 0;

  // Filter low stock items for quick reordering list (sorted by stock deficiency ratio)
  const lowStockItems = products
    .filter((p) => p.quantity <= p.minStock)
    .sort((a, b) => (a.quantity / (a.minStock || 1)) - (b.quantity / (b.minStock || 1)));

  return (
    <div className="space-y-6 font-sans">
      
      {/* Bento Stat Cards Grid */}
      <div className={`grid gap-4 ${forceMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        
        {/* Total SKUs */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group shadow-xs">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-300">
            <Package className="w-24 h-24 text-blue-600" />
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold tracking-wider uppercase">Active Products</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-gray-950 tracking-tight">{stats.totalItems}</h3>
            <p className="text-[10px] text-gray-400 mt-1">Unique item listings (SKUs)</p>
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group shadow-xs">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-300">
            <Landmark className="w-24 h-24 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Landmark className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold tracking-wider uppercase">Valuation (Retail)</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-emerald-600 tracking-tight">
              ${stats.totalValueRetail.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">
              Cost investment: ${stats.totalValueCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Projected Profit Margin */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group shadow-xs">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-300">
            <Percent className="w-24 h-24 text-amber-600" />
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Percent className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold tracking-wider uppercase">Retailing Margin</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-amber-600 tracking-tight">
              {averageMargin.toFixed(1)}%
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">
              Potential Gross Profit: +${potentialProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div id="low-stock-alert-trigger" className={`border rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group transition ${stats.lowStockCount > 0 ? 'bg-red-50 border-red-200 text-red-750' : 'bg-white border-gray-200'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-300">
            <AlertTriangle className={`w-24 h-24 ${stats.lowStockCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <AlertTriangle className={`w-4 h-4 ${stats.lowStockCount > 0 ? 'text-red-500 animate-bounce' : 'text-gray-400'}`} />
            <span className="text-xs font-semibold tracking-wider uppercase">Restock Required</span>
          </div>
          <div className="mt-4">
            <h3 className={`text-3xl font-extrabold tracking-tight ${stats.lowStockCount > 0 ? 'text-red-650 text-red-500' : 'text-gray-950'}`}>
              {stats.lowStockCount}
            </h3>
            <p className="text-[10px] text-gray-500 mt-1">
              Items under low stock threshold
            </p>
          </div>
        </div>

      </div>

      {/* Warnings & Active Replenishment Planner */}
      {lowStockItems.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <div>
                <h4 className="font-bold text-gray-950 text-sm">Replenishment Planner</h4>
                <p className="text-xs text-gray-500">Products currently needing distributor restock orders</p>
              </div>
            </div>
            <span className="text-[10px] bg-red-50 border border-red-200 text-red-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {lowStockItems.length} Warnings
            </span>
          </div>

          <div className="divide-y divide-gray-150 max-h-64 overflow-y-auto pr-1">
            {lowStockItems.map((item) => {
              const shortfall = item.minStock - item.quantity;
              const ratio = item.quantity / (item.minStock || 1);
              const isOut = item.quantity === 0;

              return (
                <div key={item.id} className="py-3 flex items-center justify-between group">
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-950 truncate">{item.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 font-mono text-[10px] text-gray-500">
                      <span>In Store: <strong className={isOut ? 'text-red-600 font-bold' : 'text-amber-605 text-amber-600 font-bold'}>{item.quantity}</strong> / {item.minStock}</span>
                      <span className="text-gray-300">|</span>
                      <span>Supplier: <span className="text-gray-700">{item.supplier || 'N/A'}</span></span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Visual custom progress bar */}
                    <div className={`${forceMobile ? 'hidden' : 'hidden md:block'} w-20 bg-gray-100 h-1.5 rounded-full overflow-hidden border border-gray-200`}>
                      <div 
                        style={{ width: `${Math.min(100, ratio * 100)}%` }}
                        className={`h-full rounded-full ${isOut ? 'bg-red-500' : 'bg-amber-500'}`}
                      />
                    </div>
                    
                    <button
                      onClick={() => onRestockClick(item)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition duration-150 cursor-pointer ${isOut ? 'bg-red-500 text-white hover:bg-red-400 shadow shadow-red-900/10' : 'bg-gray-50 hover:bg-gray-100 border border-gray-250 text-gray-700'}`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Order (+{shortfall + 10})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
