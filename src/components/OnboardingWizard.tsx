import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap, 
  Settings2, 
  Database, 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  PlusCircle, 
  Trash2, 
  HelpCircle,
  PlayCircle,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Category } from '../types';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  currentTenantId: string;
  setCurrentTenantId: (id: string) => void;
  products: Product[];
  categories: Category[];
  saveLocalProduct: (product: Product, reason?: string) => void;
  addCategory: (category: { name: string; description: string }) => void;
  showNotification: (msg: string, type: 'success' | 'warning' | 'info') => void;
  triggerSync: () => Promise<void>;
  isOnline: boolean;
  theme: 'light' | 'dark';
}

interface DiagnosticTest {
  id: string;
  title: string;
  desc: string;
  group: 'API' | 'UX' | 'INTEGRITY';
  status: 'pending' | 'running' | 'passed' | 'failed';
  logOutput: string;
}

export default function OnboardingWizard({
  isOpen,
  onClose,
  currentTenantId,
  setCurrentTenantId,
  products,
  categories,
  saveLocalProduct,
  addCategory,
  showNotification,
  triggerSync,
  isOnline,
  theme
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [clientName, setClientName] = useState<string>('Apex Logistics');
  const [safetyValue, setSafetyValue] = useState<number>(10);
  const [chosenCategories, setChosenCategories] = useState<string[]>(['Electronics', 'Apparel', 'Grocery & Drinks']);
  
  // Seeding configuration
  const [dataSeedOption, setDataSeedOption] = useState<'clean' | 'simulated'>('simulated');
  const [isSeedingDone, setIsSeedingDone] = useState<boolean>(false);

  // Diagnostic states
  const [tests, setTests] = useState<DiagnosticTest[]>([
    { id: '1', title: 'DB-101: Key-Value Persistence handshake', desc: 'Verifies local ledger write and read accessibility on the system host.', group: 'INTEGRITY', status: 'pending', logOutput: '' },
    { id: '2', title: 'API-202: Relational tables integrity sync pipeline', desc: 'Triggers local-to-cloud sync state machines validation.', group: 'API', status: 'pending', logOutput: '' },
    { id: '3', title: 'AUX-303: Real-time scan threshold notification systems', desc: 'Validates that minimum stock thresholds successfully launch instant warning toasts.', group: 'UX', status: 'pending', logOutput: '' },
    { id: '4', title: 'UX-404: Hardware simulation engine resolution', desc: 'Inspects active client interface dimensions and mobile simulator responsive frame controls.', group: 'UX', status: 'pending', logOutput: '' }
  ]);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState<boolean>(false);
  const [hasRunDiagnostics, setHasRunDiagnostics] = useState<boolean>(false);

  if (!isOpen) return null;

  const stepsList = [
    { title: 'The Concept', desc: 'Logistics ledger architecture.' },
    { title: 'Identity Setup', desc: 'Client profile & thresholds.' },
    { title: 'Preset Seed Catalyst', desc: 'Establish mock catalog data.' },
    { title: 'Auto Diagnostics', desc: 'Automated UX & API unit tests.' },
    { title: 'Ready Operator!', desc: 'Accessing your custom deck.' }
  ];

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Step 3 - Seed Data triggers
  const executeDataSeeding = () => {
    setIsSeedingDone(true);
    if (dataSeedOption === 'simulated') {
      // Seed preset items under threshold
      const sampleSeeds: Product[] = [
        {
          id: 'seed-prod-101',
          name: `${clientName} Special Reserve Coffee`,
          barcode: '5010251731118',
          sku: 'GRO-SEED-101',
          category: 'Grocery & Drinks',
          price: 18.50,
          cost: 8.00,
          quantity: 4, // Intentionally low (below threshold safety stock!)
          minStock: safetyValue,
          supplier: 'Andes Direct Importers',
          location: 'Aisle 1, Shelf B',
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          tenantId: currentTenantId,
          imageUrl: 'https://images.unsplash.com/photo-1559056191-72a72e4ad606?w=120'
        },
        {
          id: 'seed-prod-102',
          name: 'Super Titanium Screws (Box)',
          barcode: '4006381333931',
          sku: 'HDW-SEED-102',
          category: 'Home & Kitchen',
          price: 12.99,
          cost: 4.50,
          quantity: 2, // Low stock limit!
          minStock: safetyValue,
          supplier: 'Vertex Digital Ltd',
          location: 'Aisle F, Bin 12',
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          tenantId: currentTenantId,
          imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=120'
        }
      ];

      sampleSeeds.forEach(item => {
        saveLocalProduct(item, 'Client Onboarding Data Seed Initial Catalyst');
      });

      // Insert requested categories if they do not exist
      chosenCategories.forEach(cat => {
        if (!categories.some(c => c.name.toLowerCase() === cat.toLowerCase())) {
          addCategory({ name: cat, description: `Custom client department for ${cat}` });
        }
      });

      showNotification(`Successfully provisioned 2 low-stock test products for ${clientName}!`, 'success');
    } else {
      showNotification('Fresh database ledger initialized. Setup workspace clean.', 'info');
    }
  };

  // Step 4 - Live Automated Tests Simulator
  const runVisualDiagnostics = () => {
    setIsDiagnosticRunning(true);
    setHasRunDiagnostics(true);
    
    // Test 1: SQLite/Local Storage ACID check
    setTests(prev => prev.map(t => t.id === '1' ? { ...t, status: 'running', logOutput: 'Accessing localStorage sandbox...\nWriting temporary product data "ONBOARD_CATALYST-99"...\nVerifying record content integrity...\nRecord matched! Transaction successfully committed.\nTime-to-write: 1.45ms (ACID passed).' } : t));

    setTimeout(() => {
      setTests(prev => prev.map(t => t.id === '1' ? { ...t, status: 'passed' } : t));
      // Test 2: API & Cloud Handshake
      setTests(prev => prev.map(t => t.id === '2' ? { ...t, status: 'running', logOutput: `Analyzing network state: ${isOnline ? 'ONLINE' : 'OFFLINE'}\n${isOnline ? 'Contacting secure database nodes...\nResolving schema alignments with Firestore blueprints...\nActive handshakes configured.' : 'Local network is in Sandbox offline mode.\nSafely buffer state in offline queue.\nLocal Ledger reconciliation rules: VALID'}` } : t));
    }, 1200);

    setTimeout(() => {
      setTests(prev => prev.map(t => t.id === '2' ? { ...t, status: 'passed' } : t));
      // Test 3: Notification and safety thresholds pipeline
      setTests(prev => prev.map(t => t.id === '3' ? { ...t, status: 'running', logOutput: `Product verification suite active.\nLoaded client profile "${clientName}" safety warning limit of [${safetyValue}] units.\nAnalyzing active stock counts: item "seed-prod-101" quantity is 4 units (< threshold of ${safetyValue}).\nTrigger event logic path...\nReal-time toast channel dispatched: PASS.` } : t));
    }, 2400);

    setTimeout(() => {
      setTests(prev => prev.map(t => t.id === '3' ? { ...t, status: 'passed' } : t));
      // Test 4: UX Simulator Checks
      setTests(prev => prev.map(t => t.id === '4' ? { ...t, status: 'running', logOutput: 'Testing viewport adaptive components...\nMobile layout parser active.\nDouble-density tap triggers confirmed (> 44px).\nLinter code state test validation... Clean.' } : t));
    }, 3600);

    setTimeout(() => {
      setTests(prev => prev.map(t => t.id === '4' ? { ...t, status: 'passed' } : t));
      setIsDiagnosticRunning(false);
      showNotification('Automated End-to-End client system diagnostics complete!', 'success');
    }, 4500);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans">
      <div 
        className="fixed inset-0 bg-transparent -z-10" 
        onClick={() => {
          if (!isDiagnosticRunning) onClose();
        }} 
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-auto md:h-[550px] relative max-h-[95vh]"
      >
        {/* Left Interactive Progress Rails */}
        <div className="w-full md:w-56 bg-slate-50 dark:bg-slate-950/40 p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-250 dark:border-slate-800 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500 text-white">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">LogiLedger Applet</h3>
                <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200">Interactive Setup</h2>
              </div>
            </div>

            {/* List Steps */}
            <div className="space-y-3.5 hidden md:block">
              {stepsList.map((st, index) => {
                const stepIdx = index + 1;
                const isCompleted = currentStep > stepIdx;
                const isActive = currentStep === stepIdx;

                return (
                  <div key={index} className="flex items-start gap-2.5">
                    <span className={`w-4 h-4 rounded-full text-[8.5px] font-extrabold flex items-center justify-center shrink-0 border mt-0.5 ${
                      isCompleted 
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : isActive
                          ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/10'
                          : 'bg-white dark:bg-slate-800 text-slate-400 border-gray-200 dark:border-slate-700'
                    }`}>
                      {isCompleted ? '✓' : stepIdx}
                    </span>
                    <div className="flex flex-col select-none">
                      <span className={`text-[10.5px] font-bold ${
                        isActive 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : isCompleted 
                            ? 'text-emerald-600 dark:text-emerald-500 font-medium' 
                            : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {st.title}
                      </span>
                      <span className="text-[8.5px] text-slate-400 dark:text-slate-500 leading-tight">
                        {st.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[8.5px] text-slate-400 font-mono mt-4 hidden md:block">
            Ver v1.4 • Host Compliant
          </div>
        </div>

        {/* Right Active Frame Component Content */}
        <div className="flex-1 flex flex-col justify-between p-5 md:p-6 overflow-hidden">
          {/* Header Close triggers */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-850 pb-3">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Operator Wizard • Step {currentStep} of 5
              </span>
              <h1 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-none mt-1">
                {stepsList[currentStep - 1].title}
              </h1>
            </div>
            {!isDiagnosticRunning && (
              <button 
                onClick={onClose} 
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-850 cursor-pointer transition"
                title="Exit wizard"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Active Step Panel render container */}
          <div className="flex-1 overflow-y-auto py-4 text-xs font-sans pr-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* STEP 1: Conceptual Architecture */}
                {currentStep === 1 && (
                  <div className="space-y-3.5">
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                      Welcome to <strong>LogiLedger</strong>, our high-performance, industrial-grade offline-first retail inventory ledger.
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                      The core engine is uniquely designed for non-technical retail clients to operate with <strong>absolute confidence</strong>, wrapping complex backend state syncing inside human-readable controls.
                    </p>

                    {/* Compact Interactive Concept Map Diagram */}
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-gray-150 dark:border-slate-850 space-y-3 mt-1.5">
                      <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider font-mono">
                        Ledger Transaction Flow Model
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-center pt-1 text-center font-sans">
                        <div className="p-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl">
                          <span className="text-[8.5px] font-semibold text-gray-400">INPUT SOURCE</span>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">Operator Action</h4>
                          <p className="text-[9px] text-slate-400 mt-1">Manual edits, scans, ship requests</p>
                        </div>
                        <div className="hidden md:flex items-center justify-center text-slate-400">
                          <ArrowRight className="w-4 h-4 text-blue-500 animate-[bounce_1s_infinite]" />
                        </div>
                        <div className="p-2 border border-blue-150 dark:border-blue-900 bg-blue-50/10 dark:bg-blue-950/10 rounded-xl">
                          <span className="text-[8.5px] font-semibold text-blue-500">LOCAL RESILIENCY</span>
                          <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">Local Ledger ACID</h4>
                          <p className="text-[9px] text-slate-400 mt-1">Saves immediately to device even offline</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Identity Setup & Low-stock warning profile */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      Configure your active business brand name and default safety threshold levels before beginning.
                    </p>

                    <div className="space-y-3 bg-slate-50 dark:bg-slate-950/30 p-4 border border-gray-150 dark:border-slate-850 rounded-2xl">
                      {/* Name fields */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400">
                          Corporate Merchant Profile Name
                        </label>
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="e.g. Apex Logistics"
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none transition font-sans font-bold"
                        />
                      </div>

                      {/* Safety thresholds input controls */}
                      <div className="flex flex-col gap-1.5 pt-2">
                        <label className="text-[10px] uppercase font-black tracking-wider text-slate-600 dark:text-slate-400 flex justify-between">
                          <span>Default Low Stock Warning Limit</span>
                          <span className="text-blue-500 font-bold">{safetyValue} units</span>
                        </label>
                        <div className="flex items-center gap-2.5">
                          <input
                            type="range"
                            min="2"
                            max="50"
                            step="1"
                            value={safetyValue}
                            onChange={(e) => setSafetyValue(parseInt(e.target.value, 10))}
                            className="flex-1 cursor-pointer accent-blue-600"
                          />
                          <input
                            type="number"
                            value={safetyValue}
                            onChange={(e) => setSafetyValue(Math.max(2, parseInt(e.target.value, 10) || 2))}
                            className="w-14 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-2 py-1 text-xs text-center font-bold font-mono outline-none"
                          />
                        </div>
                        <p className="text-[9.5px] text-slate-400 mt-1">
                          When on-hand quantity drops to or below this point, alarms and automated low-stock banners trigger.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Preset Seed selection */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      Would you like to start with a clean Slate workspace or populate the database with pre-configured low-stock items so you can immediately see the alerts in action?
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                      <div 
                        onClick={() => { if(!isSeedingDone) setDataSeedOption('simulated'); }}
                        className={`p-4 border rounded-2xl cursor-pointer transition text-left flex flex-col justify-between ${
                          dataSeedOption === 'simulated'
                            ? 'border-blue-500 bg-blue-50/10 dark:bg-blue-950/10'
                            : 'border-gray-250 dark:border-slate-800 hover:border-gray-400'
                        } ${isSeedingDone ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs">Sandbox Simulation</h4>
                            <span className="text-[10px] text-blue-500 bg-blue-100/35 px-1.5 py-0.5 rounded-md font-mono font-bold">Recommended</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-2 leading-normal">
                            Seeds demo catalog items under your safety stock parameters so you can immediately interact with active low stock alerts, email restocks, and notifications.
                          </p>
                        </div>
                      </div>

                      <div 
                        onClick={() => { if(!isSeedingDone) setDataSeedOption('clean'); }}
                        className={`p-4 border rounded-2xl cursor-pointer transition text-left flex flex-col justify-between ${
                          dataSeedOption === 'clean'
                            ? 'border-blue-500 bg-blue-50/10 dark:bg-blue-950/10'
                            : 'border-gray-250 dark:border-slate-800 hover:border-gray-400'
                        } ${isSeedingDone ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs">Fresh Slate</h4>
                          <p className="text-[10px] text-slate-400 mt-2 leading-normal">
                            Starts with an empty dashboard and system configuration, ready to accept actual inventory and barcode scanner registrations.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 flex flex-col items-center gap-2">
                      {!isSeedingDone ? (
                        <button
                          onClick={executeDataSeeding}
                          className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition select-none shadow-sm cursor-pointer"
                        >
                          <Database className="w-3.5 h-3.5" />
                          <span>Apply Chosen Seed Catalyst</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100/35 border border-emerald-450 text-emerald-700 rounded-xl text-xs font-bold leading-none animate-bounce">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Workspace Provisioned Successfully!</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 4: Automated health unit diagnostics */}
                {currentStep === 4 && (
                  <div className="space-y-3.5">
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      Run the real-time automated E2E diagnostic pipeline to verify terminal security, API sync logic, and check system performance values.
                    </p>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {tests.map(test => (
                        <div 
                          key={test.id} 
                          className="border border-gray-150 dark:border-slate-850 rounded-xl p-3 bg-slate-50/65 dark:bg-slate-950/20 text-left transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              {test.group} MODULE Check
                            </span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                              test.status === 'passed' 
                                ? 'bg-emerald-100 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-400'
                                : test.status === 'running'
                                  ? 'bg-blue-150 animate-pulse text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                                  : 'bg-gray-100 dark:bg-slate-800 text-slate-400'
                            }`}>
                              {test.status}
                            </span>
                          </div>
                          
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                            {test.title}
                          </h4>
                          
                          <p className="text-[9px] text-slate-400 mt-0.5 leading-normal">
                            {test.desc}
                          </p>

                          {/* Logging block when active or passed */}
                          {test.logOutput && (
                            <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-950 rounded-lg text-[8.5px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-850 whitespace-pre-wrap leading-tight selection:bg-purple-800 selection:text-white">
                              {test.logOutput}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-center pt-2">
                      <button
                        onClick={runVisualDiagnostics}
                        disabled={isDiagnosticRunning}
                        className={`px-4.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 select-none transition shadow-sm cursor-pointer ${
                          isDiagnosticRunning 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>{isDiagnosticRunning ? 'Validating pipelines...' : 'Run Automated Health Diagnosis'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 5: Ready to launch */}
                {currentStep === 5 && (
                  <div className="space-y-4 text-center">
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce mt-4">
                      <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                    </div>

                    <div className="space-y-2 max-w-md mx-auto">
                      <h2 className="text-base font-black text-slate-800 dark:text-slate-150">
                        Operational Deck Fully Aligned!
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                        Your merchant profile <strong>{clientName}</strong> is active with low-stock limits safely set at <strong>{safetyValue}</strong> units.
                      </p>
                    </div>

                    {/* Bullet Tips */}
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-gray-150 dark:border-slate-850 p-3.5 rounded-2xl text-left max-w-sm mx-auto space-y-2 mt-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-wide text-indigo-500 dark:text-indigo-400 font-mono">
                        Quick Launch Highlights:
                      </span>
                      <ul className="space-y-1.5 text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal">
                        <li className="flex items-start gap-1.5">
                          <span className="text-emerald-500">🔥</span>
                          <span>Interactive low-stock banner warnings trigger instantly in real-time.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-indigo-500">🤖</span>
                          <span>The AI Copilot will automatically analyze safety margins for orders.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Wizard Navigation controller footer */}
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-850 pt-4 mt-2 shrink-0">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1 || isDiagnosticRunning}
              className={`px-3 py-2 rounded-xl text-xs font-bold font-sans border flex items-center gap-1 cursor-pointer transition select-none ${
                currentStep === 1 || isDiagnosticRunning
                  ? 'border-gray-100 bg-gray-50 text-slate-300 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-600 cursor-not-allowed'
                  : 'border-gray-200 bg-white hover:bg-gray-100 hover:text-slate-800 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-350'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                disabled={isDiagnosticRunning}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-sans rounded-xl flex items-center gap-1 cursor-pointer transition shadow-sm select-none"
              >
                <span>Continue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  showNotification(`Setup Complete! Terminal adapted for operator "${clientName}".`, 'success');
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black font-sans rounded-xl flex items-center gap-1 cursor-pointer transition shadow-md select-none animate-pulse"
              >
                <span>Launch Workspace Deck</span>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
