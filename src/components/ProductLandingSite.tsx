import React, { useState } from 'react';
import {
  Layers,
  ShieldCheck,
  Cpu,
  Zap,
  Globe,
  Clock,
  CheckCircle,
  ArrowRight,
  UserCheck,
  Smartphone,
  Lock,
  ShoppingCart,
  ClipboardCheck,
  Truck,
  BarChart3,
  Barcode,
  Wifi,
  Sparkles,
  ChevronRight,
  FileCheck,
  Database,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../types';

interface ProductLandingSiteProps {
  onEnterDemo: (role: UserRole, tenantId: string) => void;
  onEnterQuick: () => void;
}

export default function ProductLandingSite({ onEnterDemo, onEnterQuick }: ProductLandingSiteProps) {
  const [selectedTenant, setSelectedTenant] = useState<string>('tenant-apex');
  const [activePreviewTab, setActivePreviewTab] = useState<'procure' | 'counts' | 'fulfill' | 'sso'>('procure');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const demoTenants = [
    { id: 'tenant-apex', name: 'Apex Retailers', industry: 'Consumer Electronics & Sports Gear', badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    { id: 'tenant-nova', name: 'Nova Lifestyle Goods', industry: 'Boutique Apparel & Contemporary Furniture', badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
    { id: 'tenant-greensprout', name: 'GreenSprout Grocery', industry: 'Organic Coffee Imports & Beverages', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  ];

  const features = [
    {
      icon: <Layers className="w-5 h-5 text-indigo-400" />,
      title: 'Multi-Tenant Isolation',
      description: 'Zero-leak record isolation. Switch instantly between Apex, Nova, and GreenSprout work streams with individual SKU ledgers and supplier databases.',
    },
    {
      icon: <ShoppingCart className="w-5 h-5 text-pink-400" />,
      title: '3-Way Match Procurement',
      description: 'Enforces purchase order compliance. Automatically cross-references PO quantities, warehouse receipt logs, and final invoices to flags costing leaks.',
    },
    {
      icon: <ClipboardCheck className="w-5 h-5 text-emerald-405 text-emerald-400" />,
      title: 'Cyclic Audit & Discrepancies',
      description: 'Run micro cycle counts with automated tracking types (Lot, Serial, Expiry). Flags variance, calculates balance adjustments, and logs auditor notes.',
    },
    {
      icon: <Truck className="w-5 h-5 text-blue-400" />,
      title: 'Fulfillment & Carrier Boxes',
      description: 'Step-by-step pick-pack-ship routine. Interactive carrier tracking simulations (Ninja Van, J&T) with live state updates and direct RMA returns.',
    },
    {
      icon: <Lock className="w-5 h-5 text-amber-400" />,
      title: 'SSO Directory & RBAC Gateway',
      description: 'Configure corporate Single Sign-On simulation. Restrict high-value write-offs and large purchases dynamically using customizable approval limits.',
    },
    {
      icon: <Wifi className="w-5 h-5 text-cyan-400" />,
      title: 'Resilient Offline Syncer',
      description: 'Runs offline seamlessly. Tracks sync states, queues modifications locally, and reconciles instantly with remote Firestore clouds when connection recovers.',
    },
  ];

  const faqs = [
    {
      q: 'How does the Demo Login differentiate Admin and Client modes?',
      a: 'The Admin Demo logging maps you to the "Operations Director" role with a $1,000+ purchase approval tier, full read/write/reconcile overrides across the SSO gateways, and schema-wide reports. The Client Demo maps you to the "Fulfillment Coordinator" or "Warehouse Manager" role. This limits financial edits, flags high-value PO items for supervisor approval, and locks you into operational tasks like stock picker scans.',
    },
    {
      q: 'Can I test the barcode engine without a dedicated hardware scanner?',
      a: 'Absolutely! OmniShelf features a dual-mode system. You can simulate optical scanner lasers using your webcam feed (fully integrated), or type mock EAN/UPC barcodes to test rapid intake and automatic state adjustments.',
    },
    {
      q: 'How does the offline ledger operate?',
      a: 'If you mock an offline state (via the top bar "Simulate Offline" toggle button), all database writes cache automatically in IndexedDB/localStorage. System status changes to OFFLINE, and once re-established, the sync pipeline reconciles the state back with secure Firestore.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-150 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Product Top Header Bar */}
      <header className="px-6 py-4 max-w-7xl mx-auto flex items-center justify-between border-b border-slate-800/80 z-20 relative">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1.5 bg-indigo-650 bg-gradient-to-tr from-indigo-600 to-pink-600 text-white font-black rounded-lg text-[11px] uppercase tracking-wider flex items-center font-mono gap-1">
            <span>OMNISHELF</span>
          </div>
          <span className="text-xs text-slate-500 font-mono hidden md:inline">v2.4 Enterprise</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={onEnterQuick}
            className="text-xs text-slate-400 hover:text-slate-100 font-semibold transition cursor-pointer"
          >
            Explore Sandbox First
          </button>
          
          <a
            href="#demo-login"
            className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-500 transition shadow-lg shadow-indigo-900/40 active:scale-95 cursor-pointer"
          >
            Launch Demo Base
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 pt-16 pb-20 max-w-6xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded-full mb-6">
          <Sparkles className="w-3 h-3 animate-spin" />
          <span>Next-Generation Warehouse Logistics Suite</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight max-w-4xl mx-auto font-sans">
          The Decoupled Multi-Tenant <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-pink-400 to-purple-400">Inventory Ledger</span> Engine
        </h1>
        
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed">
          Unlock high-fidelity 3-way matching, dynamic QR/Barcode cataloging, custom role approvals, and robust offline sync state caching. Try our preloaded merchant workspaces now.
        </p>

        {/* Dynamic Tenant Selector for Demo Entrance */}
        <div id="demo-login" className="mt-12 p-1 bg-slate-900/60 border border-slate-800 rounded-3xl max-w-4xl mx-auto backdrop-blur-md">
          <div className="p-6 md:p-8">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">
              Step 1: Choose Your Demo Merchant Profile
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {demoTenants.map((ten) => (
                <button
                  key={ten.id}
                  onClick={() => setSelectedTenant(ten.id)}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition flex flex-col justify-between ${
                    selectedTenant === ten.id
                      ? 'bg-slate-800/80 border-indigo-500 ring-2 ring-indigo-500/30 text-white'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{ten.name}</span>
                      {selectedTenant === ten.id && (
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      {ten.industry}
                    </p>
                  </div>
                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 mt-4 rounded border ${ten.badgeColor}`}>
                    Profile Isolated
                  </span>
                </button>
              ))}
            </div>

            {/* Interactive Bidirectional Quick Trigger logins */}
            <div className="mt-8 border-t border-slate-800/80 pt-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                Step 2: Authenticate Live Demo Session
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Admin Mode portal option */}
                <div className="p-5 bg-gradient-to-br from-indigo-950/40 to-slate-900/50 border border-indigo-500/20 hover:border-indigo-500/40 rounded-2xl text-left transition group">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-indigo-505 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-bold tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase">
                      Tier 1 Role
                    </span>
                  </div>
                  
                  <h4 className="text-base font-bold text-white mt-4 flex items-center gap-1.5">
                    Operations Director (Admin) <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Full organizational authority. Manage multi-tenant configurations, authorize purchase orders without cost thresholds, clear audit logs, and override cycle count discrepancies.
                  </p>
                  
                  <button
                    onClick={() => onEnterDemo('Operations Director', selectedTenant)}
                    className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-900/30 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    Enter as Admin (Director)
                  </button>
                </div>

                {/* Operator / Client Mode portal option */}
                <div className="p-5 bg-gradient-to-br from-slate-900/50 to-slate-900/30 border border-slate-800 hover:border-slate-700 rounded-2xl text-left transition group">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-slate-800 text-slate-400 rounded-xl">
                      <Smartphone className="w-5 h-5 animate-pulse" />
                    </div>
                    <span className="text-[9px] font-bold tracking-wider text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full uppercase font-mono">
                      Service Ops
                    </span>
                  </div>
                  
                  <h4 className="text-base font-bold text-white mt-4 flex items-center gap-1.5">
                    Fulfillment Coordinator (Client) <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Operate active floor pick-packs, trigger cycle counts, log damage events, print barcode label sheets, and simulate RMA refund claims. Subject to supervisor approvals.
                  </p>
                  
                  <button
                    onClick={() => onEnterDemo('Fulfillment Coordinator', selectedTenant)}
                    className="w-full mt-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl transition border border-slate-705 border-slate-700/80 cursor-pointer flex items-center justify-center gap-2"
                  >
                    Enter as Client (Operator)
                  </button>
                </div>

              </div>

              <div className="mt-5 text-[11px] text-slate-500 font-mono flex items-center justify-center gap-1">
                <span>Demo profiles include pre-populated SKUs, simulated historical audit ledgers, and PO records.</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Catalog Grid */}
      <section className="py-20 border-t border-slate-900 bg-slate-950/40 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Built to Solve Modern Stock Challenges
            </h2>
            <p className="text-xs sm:text-sm text-slate-405 text-slate-400 mt-3 leading-relaxed">
              OmniShelf integrates seven critical inventory workflows into a unified, low-latency framework designed for operations floor accuracy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, index) => (
              <div
                key={index}
                className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl hover:border-slate-755 hover:bg-slate-900/60 hover:border-slate-700 transition duration-250 flex flex-col gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800/60 group-hover:border-slate-700 transition">
                  {feat.icon}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm tracking-tight">{feat.title}</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Live Screen Component Previews */}
      <section className="py-20 border-t border-slate-900 max-w-6xl mx-auto px-6 relative z-10">
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="max-w-md">
              <span className="text-[9px] font-black tracking-wider text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 inline-block mb-2">Live Component Pre-screens</span>
              <h3 className="text-xl md:text-2xl font-black text-white">Explore Dashboard Architecture</h3>
              <p className="text-xs text-slate-400 mt-1">Get a static operational overview of key modules before entering your role mode.</p>
            </div>

            {/* Selector Buttons */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950 rounded-xl max-w-max self-start md:self-auto border border-slate-800/60 text-[10px]">
              <button
                onClick={() => setActivePreviewTab('procure')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${activePreviewTab === 'procure' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-250'}`}
              >
                Procurement Hub
              </button>
              <button
                onClick={() => setActivePreviewTab('counts')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${activePreviewTab === 'counts' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-250'}`}
              >
                Cycle Counts
              </button>
              <button
                onClick={() => setActivePreviewTab('fulfill')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${activePreviewTab === 'fulfill' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-250'}`}
              >
                Fulfillment RMA
              </button>
              <button
                onClick={() => setActivePreviewTab('sso')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${activePreviewTab === 'sso' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-250'}`}
              >
                SSO & RBAC
              </button>
            </div>
          </div>

          {/* Interactive Screen Mimic */}
          <div className="border border-slate-805 bg-slate-950 rounded-2xl overflow-hidden font-mono text-[11px] shadow-2xl relative">
            
            {/* Top Bar Mimic */}
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between text-[10px]">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              </div>
              <span className="text-slate-500 font-bold uppercase select-none tracking-widest text-[8px]">
                {activePreviewTab === 'procure' ? 'PO MATCH SYSTEM' : activePreviewTab === 'counts' ? 'CY-C AUDITOR' : activePreviewTab === 'fulfill' ? 'FULFILL CODES' : 'SSO SECURITY'}
              </span>
              <span className="text-indigo-400 md:flex items-center gap-1 hidden">
                <Terminal className="w-3.5 h-3.5" /> preview_active_node
              </span>
            </div>

            {/* Interior Preview View */}
            <div className="p-5 text-slate-300 space-y-4 max-h-[300px] overflow-y-auto">
              
              {activePreviewTab === 'procure' && (
                <div className="space-y-3 font-sans">
                  <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] text-indigo-400 font-mono font-bold block">RECONCILED DRAFT #PO-991204</span>
                      <strong className="text-sm font-semibold text-white">Vertex Digital Ltd</strong>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold">3-Way Match Passed</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono mt-2">
                    <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[8px] uppercase">1. Ordered (PO)</span>
                      <strong className="text-white">50 units SKU</strong>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[8px] uppercase">2. Intake Receipts</span>
                      <strong className="text-white">50 units verified</strong>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[8px] uppercase">3. Supplier Invoice</span>
                      <strong className="text-white font-bold text-emerald-400">$340.00 reconciled</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic border-l-2 border-slate-800 pl-3">
                    Reconciliation engine auto-matches physical ledger entries against vendor invoices. Generates warning flags immediately upon unit price changes or quantity deviations.
                  </p>
                </div>
              )}

              {activePreviewTab === 'counts' && (
                <div className="space-y-3 font-sans">
                  <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] text-pink-400 font-mono font-bold block">CNT-108422 REGULATOR SPOT DISCREPANCY</span>
                      <strong className="text-sm font-semibold text-white">Class [B] Spoiled Count</strong>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded text-[9px] font-bold">Awaiting Approval</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded border border-slate-800 text-[11px] font-mono space-y-1 text-slate-400">
                    <div>SKU: <strong className="text-slate-200">GRO-COF-004</strong></div>
                    <div>Item: <strong className="text-slate-200">Organic Coffee Beans (1kg)</strong></div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="bg-slate-950 px-2 py-0.5 rounded text-red-400">Variance: -2 pcs</span>
                      <span className="text-slate-500">Reason: Water Damage / Spoilage</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">
                    Operator logs floor variance during physical drawer counts, and the system prompts supervisors for an authorized stock ledger reset.
                  </p>
                </div>
              )}

              {activePreviewTab === 'fulfill' && (
                <div className="space-y-3 font-sans">
                  <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] text-indigo-400 font-mono font-bold block">ORDER OUT: Cust-SO-8822</span>
                      <strong className="text-sm font-semibold text-white">Marcus Logistics Center</strong>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded text-[9px] font-bold">Shipped</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[10px] font-mono space-y-1">
                    <span className="text-slate-500 block text-[8px] uppercase">Active Transport Provider:</span>
                    <div className="flex items-center gap-2 text-slate-200">
                      <strong>J&T Express</strong> | <span>Cost: $8.50</span> | <strong className="text-indigo-400">TRK-JNT-440283112</strong>
                    </div>
                  </div>
                  <div className="space-y-1 font-mono text-[9px] text-slate-500">
                    <div>[10:15:22] Shipping Label created at origin terminal.</div>
                    <div className="text-indigo-400 font-bold">[11:34:00] Sorting completed. Dispatched en-route Changi Gateway.</div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'sso' && (
                <div className="space-y-3 font-sans">
                  <div className="flex justify-between items-center bg-slate-900/60 border border-slate-80s border-slate-800 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] text-amber-500 font-mono font-bold block">CENTRAL DISPATCH ROLE SECURITY</span>
                      <strong className="text-sm font-semibold text-white">SAML 2.0 / SSO Gate Enforced</strong>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded text-[9px] font-bold font-mono">MDM Gate Active</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                    <div>Default Corporate Approver Signoff Limit: <strong className="text-indigo-400 font-bold">$1,000.00</strong></div>
                    <div>Operational Role boundaries verified: <strong className="text-white">Active (Operations Director override)</strong></div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">
                    Bypasses direct credentials input when SSO mode is enabled globally, automatically managing clearance parameters in client environments.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-20 border-t border-slate-900 max-w-4xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <h3 className="text-2xl font-black text-white">Operational Q&A</h3>
          <p className="text-xs text-slate-400 mt-2">Get answers to how the ledger, synchronization, and profiles act during operation.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-slate-800/80 rounded-2xl bg-slate-900/20 overflow-hidden"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full px-6 py-4 text-left font-bold text-sm text-slate-200 hover:text-white flex items-center justify-between transition cursor-pointer select-none"
              >
                <span>{faq.q}</span>
                <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
              
              {expandedFaq === idx && (
                <div className="px-6 pb-5 pt-1 text-xs text-slate-400 leading-relaxed border-t border-slate-850 bg-slate-900/40">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Trust & Performance Footer Banner */}
      <section className="py-12 border-t border-slate-900 max-w-6xl mx-auto text-center px-6 z-10 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 font-mono">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Sync Latency</span>
            <strong className="text-lg font-black text-indigo-400 mt-1 block">&lt; 12ms</strong>
          </div>
          <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 font-mono">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Historical Runs</span>
            <strong className="text-lg font-black text-pink-400 mt-1 block">5,000+ audited</strong>
          </div>
          <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 font-mono">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Active Tenants</span>
            <strong className="text-lg font-black text-emerald-400 mt-1 block">Unlimited isolation</strong>
          </div>
          <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 font-mono">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Service SLA</span>
            <strong className="text-lg font-black text-blue-400 mt-1 block">99.98%</strong>
          </div>
        </div>

        <div className="text-slate-600 text-[10px] uppercase font-bold tracking-widest mt-12 mb-2 font-mono">
          OMNISHELF LOGISTICS INTELLECTS GROUP
        </div>
        <p className="text-[10px] text-slate-500">
          Decoupled local ledger synchronization. Developed using React & Vite standard environments.
        </p>
      </section>

    </div>
  );
}
