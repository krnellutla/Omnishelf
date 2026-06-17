import React, { useState, useEffect } from 'react';
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
  HelpCircle,
  Code,
  Sliders,
  Copy,
  Check,
  Search,
  BookOpen,
  Settings,
  RefreshCw,
  Eye,
  CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../types';

interface ProductLandingSiteProps {
  onEnterDemo: (role: UserRole, tenantId: string) => void;
  onEnterQuick: () => void;
}

export default function ProductLandingSite({ onEnterDemo, onEnterQuick }: ProductLandingSiteProps) {
  const [selectedTenant, setSelectedTenant] = useState<string>('tenant-apex');
  const [activePreviewTab, setActivePreviewTab] = useState<'procure' | 'counts' | 'fulfill' | 'sso'>('procure');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // --- Self-Help Guide State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHelpTab, setActiveHelpTab] = useState<'onboard' | 'sso' | 'scanner' | 'sync'>('onboard');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Custom Live Config Generator State
  const [cfgTenant, setCfgTenant] = useState('tenant-apex');
  const [cfgRole, setCfgRole] = useState<'Operations Director' | 'Fulfillment Coordinator'>('Operations Director');
  const [cfgOfflineMode, setCfgOfflineMode] = useState(true);
  const [cfgApprLimit, setCfgApprLimit] = useState(1000);
  const [cfgSsoMode, setCfgSsoMode] = useState(true);

  // Persistent Client Setup Checklist state
  const [checklist, setChecklist] = useState({
    onboardTenant: true,
    configureSSO: false,
    calibrateScanner: false,
    syncDatabase: false
  });

  useEffect(() => {
    const storedChecklist = localStorage.getItem('logiledger_onboarding_check');
    if (storedChecklist) {
      try {
        setChecklist(JSON.parse(storedChecklist));
      } catch (e) {}
    }
  }, []);

  const handleToggleCheck = (key: keyof typeof checklist) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);
    localStorage.setItem('logiledger_onboarding_check', JSON.stringify(updated));
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

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
      icon: <ClipboardCheck className="w-5 h-5 text-emerald-400" />,
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
      a: 'Absolutely! LogiLedger features a dual-mode system. You can simulate optical scanner lasers using your webcam feed (fully integrated), or type mock EAN/UPC barcodes to test rapid intake and automatic state adjustments.',
    },
    {
      q: 'How does the offline ledger operate?',
      a: 'If you mock an offline state (via the top bar "Simulate Offline" toggle button), all database writes cache automatically in IndexedDB/localStorage. System status changes to OFFLINE, and once re-established, the sync pipeline reconciles the state back with secure Firestore.',
    },
  ];

  // Self Help Articles Data
  const helpArticles = [
    {
      id: 'onboard',
      category: 'Tenant Setup',
      title: 'Registering New Merchant Workspaces',
      summary: 'Define your company structure, populate core warehouse locations, and bootstrap isolated schema partitions.',
      steps: [
        'Open the top-right Configuration Bar inside the main sandbox.',
        'Locate the "Current Tenant" drop-down list to inspect the isolated database registers.',
        'To establish a custom workspace configuration, format your local client JSON descriptor matching the JSON block shown in the code configurator below.',
        'The database partition immediately maps dedicated local state structures to isolate critical items, transactions indices, purchase orders, and cycle count metrics.'
      ],
      codeSnippet: `{
  "workspaceId": "tenant-custom-retail",
  "name": "Custom Retail Systems",
  "isolatedLedgerEnabled": true,
  "allowedLocs": ["Warehouse-A", "Transit-Dock-3"],
  "initializedTimestamp": "${new Date().toISOString()}"
}`
    },
    {
      id: 'sso',
      category: 'Identity & SSO',
      title: 'SAML 2.0 & Role Based Access Settings',
      summary: 'Configure enterprise Single Sign-On and dynamic approval triggers for stock operations.',
      steps: [
        'Navigate to the "Directory & SSO Gate" tab from the sidebar menu.',
        'Toggle the "Enforce SAML 2.0 SSO Portal" control to ON. This redirects client credentials checkups to the centralized authentication ledger.',
        'Set custom Supervisor Approval limits (e.g., $1,000). Any purchase order exceeding this sum triggers an mandatory supervisor auth block.',
        'Toggle your active login profile between "Operations Director (Admin)" and "Fulfillment Coordinator (Client)" to observe real-time screen visibility differences.'
      ],
      codeSnippet: `{
  "ssoEnforced": true,
  "defaultRole": "Fulfillment Coordinator",
  "managerApprovalLimit": 1500,
  "samlIdentityEntityId": "https://auth.logiledger.corp/sso/metadata",
  "rbacMappings": {
    "Operations Director": ["all_permissions", "override_audits", "unrestricted_approvals"],
    "Fulfillment Coordinator": ["pick_pack_ship", "cycle_counts_pending"]
  }
}`
    },
    {
      id: 'scanner',
      category: 'Scanning & Hardware',
      title: 'Calibrating Camera Webcam & Physical Scanners',
      summary: 'Enable fast barcode cataloging and EAN-13 scanning natively from the operator terminal.',
      steps: [
        'Make sure camera permissions are enabled in your browser frame. Check "camera" in metadata settings if prompted.',
        'Go to the "Print EAN Labels" or "Inventory" tab to trigger active device scans.',
        'Click "Initialize Optical Camera Camera Mode" to access high-speed video frames.',
        'For high-speed hardware scanning guns, program your hardware device to send a carriage return prefix [Enter] at the suffix of each scanned SKU sequence.'
      ],
      codeSnippet: `// Standard Hardware Scanning Event Listener config
window.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    processScannedSKU(inputBuffer);
    inputBuffer = "";
  } else {
    inputBuffer += event.key;
  }
});`
    },
    {
      id: 'sync',
      category: 'Database & Sync',
      title: 'Offline Conflict Reconciliation (3-Way Match)',
      summary: 'How LogiLedger resolves conflicting updates during temporary network outages.',
      steps: [
        'LogiLedger uses a standard local-first client cache configured to function seamlessly offline.',
        'When network latency is simulated or real disconnection occurs, changes are deferred to local storage registers.',
        'Upon reconnecting, the sync manager evaluates timestamps and transaction counts to issue local-to-cloud atomic operations.',
        'Purchase orders are verified using our strict 3-way match logic (comparing Ordered PO units, Intake Warehouse Receipt metrics, and the Billing Cost Invoice lines).'
      ],
      codeSnippet: `// 3-Way Match Validation Logic
function validateThreeWayMatch(purchaseOrder) {
  const poQty = purchaseOrder.qtyTotal;
  const receivedQty = purchaseOrder.qtyReceived;
  const invoiceQty = purchaseOrder.qtyInvoiced;
  
  const matches = (poQty === receivedQty) && (receivedQty === invoiceQty);
  return {
    reconciled: matches,
    variance: poQty - receivedQty,
    invoiceDeviation: purchaseOrder.vendorChargedTotal - purchaseOrder.expectedTotal
  };
}`
    }
  ];

  const currentHelpArticle = helpArticles.find(a => a.id === activeHelpTab) || helpArticles[0];

  // Config Generator Output schema
  const previewJsonOutput = `{
  "platform": "LogiLedger Enterprise",
  "version": "v2.4-stable",
  "activeTenant": {
    "id": "${cfgTenant}",
    "name": "${demoTenants.find(t => t.id === cfgTenant)?.name || ''}",
    "domain": "${cfgTenant}.logiledger.app"
  },
  "security": {
    "ssoGateEnforced": ${cfgSsoMode},
    "defaultUserRole": "${cfgRole}",
    "maxPurchaseApprovalThreshold": ${cfgApprLimit}
  },
  "localClientRegistry": {
    "localStorageFallback": true,
    "offlineSyncQueue": ${cfgOfflineMode},
    "indexedDbNamespace": "omni_ledger_${cfgTenant}",
    "offlineSyncFallbackLatency": "12ms"
  },
  "hardwareProfiles": {
    "webcamEanReader": true,
    "thermalLabelPrinter": "Standard-ZPL-4in"
  }
}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-150 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Product Top Header Bar */}
      <header className="px-6 py-4 max-w-7xl mx-auto flex items-center justify-between border-b border-slate-800/80 z-20 relative">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center font-mono gap-1.5 shadow-lg shadow-indigo-900/20">
            <Layers className="w-3.5 h-3.5" />
            <span>LOGILEDGER</span>
          </div>
          <span className="text-xs text-slate-500 font-mono hidden md:inline">v2.4 Enterprise Ledger</span>
        </div>
        
        <div className="flex items-center gap-4">
          <a
            href="#self-help"
            className="text-xs text-slate-400 hover:text-slate-100 font-semibold transition cursor-pointer flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Setup Help</span>
          </a>
          
          <button
            onClick={onEnterQuick}
            className="text-xs text-slate-400 hover:text-slate-100 font-semibold transition cursor-pointer hidden sm:inline"
          >
            Explore Sandbox
          </button>
          
          <a
            href="#demo-login"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-900/40 active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>Launch Base</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Hero Section containing detailed professional-grade interactive vector SVG clip-art */}
      <section className="px-6 pt-16 pb-20 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Texts */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded-full">
              <Sparkles className="w-3 h-3 animate-spin" />
              <span>Multi-Tenant Enterprise Logistics Ecosystem</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight font-sans">
              Decoupled Logistics <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-pink-400 to-cyan-400">Inventory Ledger</span> & SSO Gate
            </h1>
            
            <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
              Achieve absolute database record isolation across merchant channels. Fast webcams label printing, cyclic spot count discrepancies tracking, robust offline SQLite equivalents, and SAML authorizations. 
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="#demo-login"
                className="px-5 py-3 bg-gradient-to-tr from-indigo-600 to-pink-600 text-white font-bold text-sm rounded-xl hover:opacity-90 transition shadow-xl shadow-indigo-950/50 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>Authorize Demo Session</span>
                <Sliders className="w-4 h-4" />
              </a>

              <a
                href="#self-help"
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-250 font-bold text-sm rounded-xl transition border border-slate-800 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>Browse Self-Help Bureau</span>
                <BookOpen className="w-4 h-4 text-emerald-400 animate-pulse" />
              </a>
            </div>

            {/* Quick Stats banner bar inside Hero */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/60 max-w-lg font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Ledger Speed</span>
                <strong className="text-sm font-bold text-white">&lt; 15ms local cache</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Conflict Resolv</span>
                <strong className="text-sm font-bold text-indigo-400">Timestamp Auto</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Encryption</span>
                <strong className="text-sm font-bold text-emerald-400">AES-256 Cloud</strong>
              </div>
            </div>
          </div>

          {/* Right Hero Graphic: HIGH-GRADE INTERACTIVE TECHNICAL MULTI-LAYER CLIP ART PICTURE */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-pink-500/10 rounded-3xl filter blur-3xl opacity-65 -z-10" />
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-md relative overflow-hidden group">
              
              {/* Grid backdrop overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-15" />
              
              <div className="relative z-10 flex flex-col items-center">
                
                {/* Micro operational header */}
                <div className="w-full flex items-center justify-between mb-4 text-[10px] text-slate-400 font-mono border-b border-slate-800/80 pb-3">
                  <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    SYSTEM_NODE_VERIFY
                  </span>
                  <span>O-SHELF // REGISTRY</span>
                </div>

                {/* Professional Grade Native SVG Clip Art Illustration */}
                <svg viewBox="0 0 400 340" className="w-full h-auto drop-shadow-2xl select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Define filters & linear gradients for glowing vector highlights */}
                  <defs>
                    <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                    <linearGradient id="grad-pink" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#db2777" stopOpacity="0.4" />
                    </linearGradient>
                    <linearGradient id="grad-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#0891b2" />
                    </linearGradient>
                    <linearGradient id="mesh" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="8" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="laser-glow" x="-10%" y="-10%" width="120%" height="120%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* 1. Base Isometric Floor Grid Plate / Server Rack */}
                  <path d="M200 320 L370 235 L370 120 L200 205 Z" fill="url(#mesh)" stroke="#334155" strokeWidth="1.5" />
                  <path d="M200 320 L30 235 L30 120 L200 205 Z" fill="#1e293b" fillOpacity="0.6" stroke="#334155" strokeWidth="1.5" />
                  <path d="M30 120 L200 35 L370 120 L200 205 Z" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

                  {/* 2. Concentric Data Flow Ring (glowing circles) */}
                  <ellipse cx="200" cy="120" rx="140" ry="65" stroke="url(#grad-blue)" strokeWidth="2.5" strokeDasharray="12,18" />
                  <ellipse cx="200" cy="120" rx="110" ry="50" stroke="#f472b6" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4,8" />
                  
                  {/* 3. Floating 3D Isometric Server Chassis Blocks (SaaS Cloud Node modules) */}
                  {/* Main Database Server (Left Side representation) */}
                  <g transform="translate(75, 140)">
                    {/* Top Face */}
                    <path d="M50 0 L100 25 L50 50 L0 25 Z" fill="url(#grad-blue)" stroke="#818cf8" strokeWidth="1" />
                    {/* Left Face */}
                    <path d="M0 25 L50 50 L50 80 L0 55 Z" fill="#4338ca" />
                    {/* Right Face */}
                    <path d="M50 50 L100 25 L100 55 L50 80 Z" fill="#312e81" />
                    
                    {/* Tech details on side panel */}
                    <ellipse cx="50" cy="25" rx="5" ry="2.5" fill="#e0e7ff" />
                    <line x1="15" y1="40" x2="35" y2="50" stroke="#10b981" strokeWidth="2" />
                    <line x1="15" y1="46" x2="35" y2="56" stroke="#10b981" strokeWidth="2" />
                    <line x1="60" y1="62" x2="85" y2="50" stroke="#ec4899" strokeWidth="2" />
                    <circle cx="28" cy="45" r="2" fill="#22c55e" />
                    <circle cx="72" cy="56" r="2" fill="#f59e0b" />
                  </g>

                  {/* Multi-Tenant Container (Right Side representation) */}
                  <g transform="translate(210, 140)">
                    {/* Top Face */}
                    <path d="M50 0 L100 25 L50 50 L0 25 Z" fill="url(#grad-pink)" stroke="#ec4899" strokeWidth="1" />
                    {/* Left Face */}
                    <path d="M0 25 L50 50 L50 80 L0 55 Z" fill="#be185d" />
                    {/* Right Face */}
                    <path d="M50 50 L100 25 L100 55 L50 80 Z" fill="#831843" />
                    
                    {/* Lines replicating server stripes */}
                    <line x1="15" y1="40" x2="35" y2="50" stroke="#22d3ee" strokeWidth="2" />
                    <line x1="15" y1="46" x2="35" y2="56" stroke="#22d3ee" strokeWidth="2" />
                    <circle cx="28" cy="45" r="2" fill="#a855f7" />
                  </g>

                  {/* 4. Centerpiece Isometric Shipping Carton Box */}
                  <g transform="translate(150, 75)">
                    {/* Top Package Face (Brown Flat cardboard replication styled to look neon premium) */}
                    <path d="M50 0 L100 25 L50 50 L0 25 Z" fill="#334155" stroke="#475569" strokeWidth="1.5" />
                    {/* Left Box shadow face */}
                    <path d="M0 25 L50 50 L50 90 L0 65 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                    {/* Right Box bright face */}
                    <path d="M50 50 L100 25 L100 65 L50 90 Z" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
                    
                    {/* Cardboard top tape sticker detailing */}
                    <path d="M50 12 L75 25 L50 38 L25 25 Z" fill="#6366f1" fillOpacity="0.3" stroke="#818cf8" strokeWidth="1" />
                    
                    {/* Simulated shipping label clip art barcode pattern on package right face */}
                    <path d="M60 48 L90 33 L90 53 L60 68 Z" fill="#ffffff" fillOpacity="0.85" />
                    <line x1="65" y1="52" x2="65" y2="60" stroke="#000000" strokeWidth="1.5" />
                    <line x1="70" y1="49.5" x2="70" y2="57.5" stroke="#000000" strokeWidth="1.5" />
                    <line x1="73" y1="48" x2="73" y2="56" stroke="#000000" strokeWidth="0.5" />
                    <line x1="77" y1="46" x2="77" y2="54" stroke="#000000" strokeWidth="2.5" />
                    <line x1="82" y1="43.5" x2="82" y2="51.5" stroke="#000000" strokeWidth="1.5" />
                  </g>

                  {/* 5. Glowing Laser Scanning Beams & Active Webhook pulse circles */}
                  {/* Laser point line */}
                  <line x1="200" y1="10" x2="200" y2="105" stroke="#ec4899" strokeWidth="2" filter="url(#laser-glow)" />
                  <ellipse cx="200" cy="105" rx="14" ry="7" fill="#ec4899" fillOpacity="0.4" filter="url(#glow)" />
                  <ellipse cx="200" cy="105" rx="6" ry="3" fill="#ffffff" />
                  
                  {/* Floating data spheres (floating isolated tenant cloud nodes) */}
                  <g className="animate-bounce" style={{ animationDuration: '6s' }}>
                    <circle cx="310" cy="60" r="10" fill="url(#grad-cyan)" filter="url(#glow)" />
                    <circle cx="310" cy="60" r="4" fill="#ffffff" />
                  </g>
                  
                  <g className="animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                    <circle cx="90" cy="65" r="8" fill="url(#grad-pink)" filter="url(#glow)" />
                    <circle cx="90" cy="65" r="3" fill="#ffffff" />
                  </g>

                  {/* Tech annotations text overlay in illustration */}
                  <text x="325" y="65" fill="#22d3ee" fontSize="8" fontFamily="font-mono" fontWeight="bold" letterSpacing="1">SEC_SYNC</text>
                  <text x="30" y="70" fill="#f472b6" fontSize="8" fontFamily="font-mono" fontWeight="bold" letterSpacing="1">TENANT_A</text>

                </svg>

                {/* Simulated live telemetry ledger readout */}
                <div className="w-full mt-4 bg-slate-950 p-3 rounded-2xl border border-slate-800 font-mono text-[9px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-indigo-400">CONNECT State:</span>
                    <span className="text-emerald-400 font-bold">ONLINE (CLOUD)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sync queue:</span>
                    <span className="text-slate-350">0 entries pending reconcile</span>
                  </div>
                  <div className="flex justify-between">
                    <span>EAN scan buffer:</span>
                    <span className="text-slate-500 font-bold">[SYS-ACK-200] MATCHED</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Dynamic Tenant and Authenticate Profiles Section (Demo Login) */}
      <section id="demo-login" className="px-6 py-12 max-w-6xl mx-auto relative z-10 scroll-mt-6">
        <div className="p-1 bg-slate-900/60 border border-slate-800 rounded-3xl max-w-4xl mx-auto backdrop-blur-md shadow-2xl">
          <div className="p-6 md:p-8">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 inline-block mb-2">Step-by-step Demo Entry</span>
              <h3 className="text-xl md:text-2xl font-black text-white">Select Workspace & Authenticate</h3>
              <p className="text-xs text-slate-400 mt-1">
                Choose one of three pre-loaded isolated corporate profiles, then select either Admin (Operations Director) or Client (Fulfillment Coordinator) access.
              </p>
            </div>
            
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
                      <span className="font-bold text-sm text-slate-100">{ten.name}</span>
                      {selectedTenant === ten.id && (
                        <span className="w-2h-2 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      {ten.industry}
                    </p>
                  </div>
                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 mt-4 rounded border ${ten.badgeColor}`}>
                    Channel Partitioned
                  </span>
                </button>
              ))}
            </div>

            {/* Interactive Bidirectional Quick Trigger logins */}
            <div className="mt-8 border-t border-slate-800/80 pt-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Admin Mode portal option */}
                <div className="p-5 bg-gradient-to-br from-indigo-950/40 to-slate-900/50 border border-indigo-500/20 hover:border-indigo-500/40 rounded-2xl text-left transition group">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                      <UserCheck className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="text-[9px] font-bold tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase font-mono">
                      Admin Clearance
                    </span>
                  </div>
                  
                  <h4 className="text-base font-bold text-white mt-4 flex items-center gap-1.5">
                    Operations Director (Admin) <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Unrestricted writes & audit overrides. Manage database configurations, approve purchase orders exceeding standard supervisor cost limits, purge transaction historical logs, and bypass SSO gate overrides.
                  </p>
                  
                  <button
                    onClick={() => onEnterDemo('Operations Director', selectedTenant)}
                    className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-900/30 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Enter as Admin (Director)</span>
                    <Sliders className="w-4 h-4" />
                  </button>
                </div>

                {/* Operator / Client Mode portal option */}
                <div className="p-5 bg-gradient-to-br from-slate-900/50 to-slate-900/30 border border-slate-800 hover:border-slate-700 rounded-2xl text-left transition group">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-slate-800 text-slate-400 rounded-xl">
                      <Smartphone className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="text-[9px] font-bold tracking-wider text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full uppercase font-mono">
                      Operator Portal
                    </span>
                  </div>
                  
                  <h4 className="text-base font-bold text-white mt-4 flex items-center gap-1.5">
                    Fulfillment Coordinator (Client) <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Focuses on floor execution. Pick, pack, and ship orders, print barcode labels, trigger cycle count requests, and write off damaged goods (subject to the director approval system limits).
                  </p>
                  
                  <button
                    onClick={() => onEnterDemo('Fulfillment Coordinator', selectedTenant)}
                    className="w-full mt-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl transition border border-slate-700 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Enter as Operator (Client)</span>
                    <Truck className="w-4 h-4" />
                  </button>
                </div>

              </div>

              <div className="mt-5 text-[11px] text-slate-500 font-mono flex items-center justify-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Profiles pre-populated with individual tenant SKUs, active PO drafts, and carrier routes.</span>
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
              SaaS Operational Core
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
              LogiLedger integrates seven critical inventory modules into a low-latency, resilient dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, index) => (
              <div
                key={index}
                className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl hover:border-slate-700 hover:bg-slate-900/60 transition duration-250 flex flex-col gap-4 group"
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

      {/* --- PROFESSIONAL INTERACTIVE SELF-HELP & CLIENT SETUP CENTER --- */}
      <section id="self-help" className="py-20 border-t border-slate-900 bg-slate-950/80 relative z-10 scroll-mt-6">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* Section Introduction */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 inline-block mb-2">Self-Help Onboarding Center</span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              LogiLedger Client Integration Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
              Complete, professional technical documentation, code snippets, copyable templates, and onboarding checklist to setup, authenticate, and connect your client nodes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT SIDE: Tab Selection & Quick Status Checklist */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Category selector */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                <span className="text-[9px] font-black tracking-widest text-slate-500 block uppercase px-2 mb-3">Onboarding Chapters</span>
                
                <button
                  onClick={() => { setActiveHelpTab('onboard'); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold text-left transition ${activeHelpTab === 'onboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:text-white hover:bg-slate-850'}`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block font-semibold">1. Tenant Provisioning</span>
                    <span className="text-[10px] opacity-70 block font-normal truncate">Configure isolated SKU schemas</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => { setActiveHelpTab('sso'); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold text-left transition ${activeHelpTab === 'sso' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:text-white hover:bg-slate-850'}`}
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block font-semibold">2. SSO & SAML Gate</span>
                    <span className="text-[10px] opacity-70 block font-normal truncate font-sans">Corporate identity lookup</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => { setActiveHelpTab('scanner'); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold text-left transition ${activeHelpTab === 'scanner' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:text-white hover:bg-slate-850'}`}
                >
                  <Barcode className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block font-semibold">3. Hardwares & Scans</span>
                    <span className="text-[10px] opacity-70 block font-normal truncate font-sans">EAN labels laser setups</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => { setActiveHelpTab('sync'); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold text-left transition ${activeHelpTab === 'sync' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:text-white hover:bg-slate-850'}`}
                >
                  <RefreshCw className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block font-semibold">4. Sync & Conflict Fallback</span>
                    <span className="text-[10px] opacity-70 block font-normal truncate font-sans">3-way match offline resolution</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>

              {/* PERSISTENT ONBOARDING CHECKLIST INTERACTIVE FRAME */}
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
                  <span className="text-[10px] font-black tracking-widest text-slate-450 text-slate-400 uppercase">Onboarding Checklist</span>
                  <span className="text-[10px] font-bold text-indigo-400 font-mono">
                    {Object.values(checklist).filter(Boolean).length}/4 Done
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Tick off onboarding setup steps as you verify each corporate segment in the demo.
                </p>

                <div className="space-y-3">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none group text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={checklist.onboardTenant}
                      onChange={() => handleToggleCheck('onboardTenant')}
                      className="mt-0.5 accent-indigo-600 w-4 h-4 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className={`font-semibold ${checklist.onboardTenant ? 'line-through text-slate-500' : 'text-slate-200 group-hover:text-white'}`}>Onboard Isolated Tenant Ledger</span>
                      <p className="text-[9px] text-slate-500">Apex, Nova or GreenSprout catalog bootstrapped</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer select-none group text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={checklist.configureSSO}
                      onChange={() => handleToggleCheck('configureSSO')}
                      className="mt-0.5 accent-indigo-600 w-4 h-4 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className={`font-semibold ${checklist.configureSSO ? 'line-through text-slate-500' : 'text-slate-200 group-hover:text-white'}`}>Active Directory & SSO Gate</span>
                      <p className="text-[9px] text-slate-500 font-sans">Verified authorization roles & approval limit triggers</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer select-none group text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={checklist.calibrateScanner}
                      onChange={() => handleToggleCheck('calibrateScanner')}
                      className="mt-0.5 accent-indigo-600 w-4 h-4 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className={`font-semibold ${checklist.calibrateScanner ? 'line-through text-slate-500' : 'text-slate-200 group-hover:text-white'}`}>Test Optical Camera Barcode scanner</span>
                      <p className="text-[9px] text-slate-500 font-sans">Checked EAN webcam alignment layout</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer select-none group text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={checklist.syncDatabase}
                      onChange={() => handleToggleCheck('syncDatabase')}
                      className="mt-0.5 accent-indigo-600 w-4 h-4 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className={`font-semibold ${checklist.syncDatabase ? 'line-through text-slate-500' : 'text-slate-200 group-hover:text-white'}`}>Trigger Database Reconciles</span>
                      <p className="text-[9px] text-slate-500 font-sans">Run a 3-way match and view the audit logs</p>
                    </div>
                  </label>
                </div>

                {Object.values(checklist).every(Boolean) && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[11px] font-mono text-center flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4 animate-bounce" />
                    <span>Onboarding Requirements Met!</span>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT SIDE: Interactive Documentation Viewer & Copy-able Config blocks */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Dynamic Interactive Panel */}
              <div className="bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-800/80 space-y-6 relative">
                
                {/* Header detailing Category */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/50">
                  <div>
                    <span className="text-[9px] font-mono font-black tracking-widest text-[#6366f1] uppercase">CHAPTER DOCUMENTATION</span>
                    <h3 className="text-lg font-black text-white mt-1 flex items-center gap-2">
                      {currentHelpArticle.category}: {currentHelpArticle.title}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-400 text-[10px] font-mono rounded">
                    SYS-REF // {currentHelpArticle.id.toUpperCase()}-001
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  {currentHelpArticle.summary}
                </p>

                {/* Step Breakdown */}
                <div className="space-y-3 font-sans">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Step-by-step Setup Protocol:</h4>
                  <ol className="space-y-3">
                    {currentHelpArticle.steps.map((step, idx) => (
                      <li key={idx} className="flex gap-3 text-xs text-slate-400 leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Copyable Codeblock */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-indigo-400" />
                      Configuration Schema Reference (JSON / Code)
                    </span>
                    <button
                      onClick={() => handleCopy(currentHelpArticle.codeSnippet, 'snippet')}
                      className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 cursor-pointer font-bold"
                    >
                      {copiedText === 'snippet' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Snippet</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-[11px] text-indigo-350 text-indigo-300 overflow-x-auto max-h-[220px] scrollbar-thin">
                    <code>{currentHelpArticle.codeSnippet}</code>
                  </pre>
                </div>

              </div>

              {/* INTERACTIVE COMPREHENSIVE CONFIG GENERATOR */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950/20 p-6 md:p-8 rounded-3xl border border-slate-800/80 space-y-6">
                
                <div className="border-b border-slate-800/60 pb-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-pink-400 animate-pulse" />
                    <span className="text-[10px] font-black tracking-widest text-[#ef4444] text-pink-400 uppercase">CLI & INITIALIZATION SANDBOX</span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">Live client.config.json Generator</h3>
                  <p className="text-xs text-slate-400 mt-1">Custom configure your operational system client, generate the JSON config format instantly, and wire the local databases.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start font-sans">
                  
                  {/* Left Controls */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">Configure Default Tenant Profile</label>
                      <select
                        value={cfgTenant}
                        onChange={(e) => setCfgTenant(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="tenant-apex">Apex Retailers (Electronics)</option>
                        <option value="tenant-nova">Nova Lifestyle (Lifestyle Goods)</option>
                        <option value="tenant-greensprout">GreenSprout Grocery (Beverages)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">Enforce Authentication Level (RBAC)</label>
                      <select
                        value={cfgRole}
                        onChange={(e) => setCfgRole(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="Operations Director">Operations Director (Admin Access)</option>
                        <option value="Fulfillment Coordinator">Fulfillment Coordinator (Client Access)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">Max Single Spend Approval limit</label>
                      <input
                        type="range"
                        min="500"
                        max="5000"
                        step="250"
                        value={cfgApprLimit}
                        onChange={(e) => setCfgApprLimit(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1">
                        <span>$500.00 Limit</span>
                        <strong className="text-indigo-400 font-bold">${cfgApprLimit.toLocaleString()}.00</strong>
                        <span>$5,000 Limit</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => { setCfgSsoMode(!cfgSsoMode); }}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${cfgSsoMode ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>SSO Gate {cfgSsoMode ? 'ON' : 'OFF'}</span>
                      </button>

                      <button
                        onClick={() => { setCfgOfflineMode(!cfgOfflineMode); }}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${cfgOfflineMode ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                      >
                        <Wifi className="w-3.5 h-3.5" />
                        <span>Offline Sync {cfgOfflineMode ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>

                  </div>

                  {/* Right Live-schema Output block */}
                  <div className="space-y-3 font-mono">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Generated Config Schema</span>
                      <button
                        onClick={() => handleCopy(previewJsonOutput, 'generatedConfig')}
                        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                      >
                        {copiedText === 'generatedConfig' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-405 text-emerald-400" />
                            <span className="text-emerald-400">Copied Schema!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Schema</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-[10px] text-slate-300 overflow-x-auto max-h-[200px] scrollbar-thin">
                      <code>{previewJsonOutput}</code>
                    </pre>
                  </div>

                </div>

              </div>

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
                <div className="px-6 pb-5 pt-1 text-xs text-slate-400 leading-relaxed border-t border-slate-850 bg-slate-900/40 font-mono">
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
            <strong className="text-lg font-black text-emerald-400 mt-1 block font-mono">Isolated schemas</strong>
          </div>
          <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 font-mono">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Service SLA</span>
            <strong className="text-lg font-black text-blue-400 mt-1 block">99.98%</strong>
          </div>
        </div>

        <div className="text-slate-600 text-[10px] uppercase font-bold tracking-widest mt-12 mb-2 font-mono">
          LOGILEDGER LOGISTICS SOFTWARE GROUP
        </div>
        <p className="text-[10px] text-slate-500">
          Decoupled multi-tenant database ledger synchronization. Developed using React & Vite standard environments.
        </p>
      </section>

    </div>
  );
}
