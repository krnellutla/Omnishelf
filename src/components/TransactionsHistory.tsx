/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { Download, Search, Filter, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, Tag, ClipboardList } from 'lucide-react';

interface TransactionsHistoryProps {
  transactions: Transaction[];
  onClearLogs?: () => void;
  forceMobile?: boolean;
}

export default function TransactionsHistory({ transactions, onClearLogs, forceMobile }: TransactionsHistoryProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');

  // Filter list
  const filtered = transactions.filter((tx) => {
    const matchesSearch = 
      tx.productName.toLowerCase().includes(search.toLowerCase()) ||
      tx.reason.toLowerCase().includes(search.toLowerCase()) ||
      tx.productId.toLowerCase().includes(search.toLowerCase());
      
    const matchesType = filterType === 'ALL' || tx.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Export to CSV generator
  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    
    // Header row
    const headers = ['ID', 'Timestamp', 'Product ID', 'Product Name', 'Transaction Type', 'Changed Qty', 'Prev Qty', 'New Qty', 'Notes/Reason', 'Staff ID'];
    
    // Construct CSV lines
    const rows = filtered.map((t) => [
      t.id,
      t.timestamp,
      t.productId,
      `"${t.productName.replace(/"/g, '""')}"`,
      t.type,
      t.quantityChanged,
      t.previousQuantity,
      t.newQuantity,
      `"${t.reason.replace(/"/g, '""')}"`,
      t.userId
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `retail_inventory_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 font-sans shadow-xs">
      
      {/* Title & Actions */}
      <div className={`flex flex-col gap-4 ${forceMobile ? '' : 'md:flex-row md:items-center justify-between'}`}>
        <div>
          <h3 className="font-bold text-gray-950 text-base flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-650" /> Stock Audit Logs
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Immutable record of all inventory movements and cash registry transactions</p>
        </div>

        <div className="flex items-center gap-2">
          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="text-xs font-bold px-3 py-2 text-red-650 hover:bg-red-50 border border-red-200 rounded-xl transition duration-150 cursor-pointer"
            >
              Clear Logs
            </button>
          )}
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-750 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl text-xs font-semibold shadow-xs transition duration-150 cursor-pointer"
          >
            <Download className="w-4 h-4 cursor-pointer" /> Export CSV Spreadsheet
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className={`grid gap-3 ${forceMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
        
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search products or check notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-255 hover:border-gray-300 focus:border-blue-600 focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 outline-none transition"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className={`flex bg-gray-100 border border-gray-200 p-0.5 rounded-xl overflow-x-auto select-none ${forceMobile ? 'w-full' : 'md:col-span-2'}`}>
          <button
            onClick={() => setFilterType('ALL')}
            className={`flex-1 text-center py-1.5 px-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 cursor-pointer ${filterType === 'ALL' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
          >
            All Logs ({transactions.length})
          </button>
          
          <button
            onClick={() => setFilterType('IN')}
            className={`flex-1 text-center py-1.5 px-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${filterType === 'IN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Stock In
          </button>

          <button
            onClick={() => setFilterType('OUT')}
            className={`flex-1 text-center py-1.5 px-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${filterType === 'OUT' ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" /> Sales / Stock Out
          </button>

          <button
            onClick={() => setFilterType('ADJUSTMENT')}
            className={`flex-1 text-center py-1.5 px-3 rounded-lg text-xs font-bold tracking-wide transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${filterType === 'ADJUSTMENT' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Adjustments
          </button>
        </div>

      </div>

      {/* History List */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-xs">
        {filtered.length > 0 ? (
          <div className="divide-y divide-gray-150 max-h-[400px] overflow-y-auto">
            {filtered.map((tx) => {
              const isIn = tx.type === 'IN';
              const isOut = tx.type === 'OUT';
              
              let BadgeColor = 'bg-gray-100 text-gray-500 border border-gray-200';
              let IconComp = RefreshCw;
              
              if (isIn) {
                BadgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                IconComp = ArrowUpRight;
              } else if (isOut) {
                BadgeColor = 'bg-red-50 text-red-700 border border-red-200';
                IconComp = ArrowDownRight;
              } else {
                BadgeColor = 'text-blue-700 bg-blue-50 border border-blue-200';
              }

              return (
                <div key={tx.id} className="p-4 flex items-start justify-between gap-4 hover:bg-gray-50/50 transition border-b border-gray-100/50">
                  {/* Left Column: Icon + Details */}
                  <div className="flex items-start gap-4 min-w-0">
                    <span className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${BadgeColor}`}>
                      <IconComp className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-950 truncate">{tx.productName}</span>
                        <span className="font-mono text-[9px] text-gray-550 bg-gray-100 px-1 py-0.5 rounded">
                          {tx.productId}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-605 text-gray-600 mt-1 max-w-lg leading-relaxed">{tx.reason}</p>
                      
                      {/* Sub row */}
                      <div className="flex items-center gap-3 mt-2 font-mono text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-gray-300" /> {formatTime(tx.timestamp)}</span>
                        <span>•</span>
                        <span>User: <strong className="text-gray-600 font-normal">{tx.userId}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Numbers */}
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-bold font-mono ${isIn ? 'text-emerald-600' : isOut ? 'text-red-600' : 'text-blue-600'}`}>
                      {isIn ? '+' : isOut ? '-' : ''}{tx.quantityChanged}
                    </div>
                    
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                      Stock: {tx.previousQuantity} → {tx.newQuantity}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-12 space-y-2 bg-white rounded-xl">
            <ClipboardList className="w-8 h-8 text-gray-300 mx-auto" strokeWidth={1} />
            <h4 className="text-gray-400 font-bold text-xs">No records found</h4>
            <p className="text-[10px] text-gray-400 max-w-xs mx-auto">No operations matched your search index query or type toggle filter.</p>
          </div>
        )}
      </div>

    </div>
  );
}
