/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, ChangeEvent } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, Play, RefreshCw, AlertCircle, Sparkles, Volume2, VolumeX, Keyboard, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onClose: () => void;
  productsList?: Product[];
}

export default function BarcodeScanner({ onScanSuccess, onClose, productsList = [] }: BarcodeScannerProps) {
  const [cameraState, setCameraState] = useState<'idle' | 'loading' | 'active' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [manualCode, setManualCode] = useState<string>('');
  const [scanMode, setScanMode] = useState<'auto' | 'barcode' | 'qr'>('auto');
  const [simulatorTab, setSimulatorTab] = useState<'1d' | '2d'>('1d');
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const readerId = 'barcode-camera-reader';

  // Realistic preloaded mock QR labels for quick 2D scan simulations
  const mockQRLabels = [
    {
      code: productsList[0]?.barcode || '7412095',
      label: `QR SKU: ${productsList[0]?.name || 'Primary Catalog SKU'}`,
      description: 'Mock 2D product label, scans to select the active catalog item.',
    },
    {
      code: 'QR-LOC-SHELF-D4',
      label: 'QR Bin: GATEWAY-D4',
      description: 'Physical shelf allocation tag (scans to trigger registration).',
    },
    {
      code: 'QR-BATCH-LOT-779A',
      label: 'QR Expiry: Lot #779A',
      description: 'Batch-specific supply-chain tracking block code.',
    },
    {
      code: 'QR-RMA-TRANSFER-9',
      label: 'QR Transfer: Return #9102',
      description: 'Reverse industrial logistics transfer barcode.',
    }
  ];

  const [scanHistory, setScanHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('logiledger_scanned_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleScanSuccess = (code: string) => {
    playBeep();
    const updated = [code, ...scanHistory.filter((c) => c !== code)].slice(0, 5);
    setScanHistory(updated);
    try {
      localStorage.setItem('logiledger_scanned_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save scan history', e);
    }
    onScanSuccess(code);
  };

  // Initialize Audio Context for beeping
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime); // High pitch crisp beep
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio feedback failed', e);
    }
  };

  // Find camera devices
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available
          const backCam = devices.find(
            (device) =>
              device.label.toLowerCase().includes('back') ||
              device.label.toLowerCase().includes('environment') ||
              device.label.toLowerCase().includes('rear')
          );
          setActiveCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setCameraState('error');
          setErrorMessage('No camera devices detected or permissions blocked.');
        }
      })
      .catch((err) => {
        console.error('Error getting cameras', err);
        setCameraState('error');
        setErrorMessage('Failed to request camera list. Browser might be running in sandboxed mode.');
      });

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraIdToUse: string) => {
    if (!cameraIdToUse) return;
    setCameraState('loading');
    setErrorMessage('');

    // Stop existing if any
    if (scannerRef.current && scannerRef.current.isScanning) {
      await stopScanner();
    }

    try {
      // Determine formats to look for based on scanMode preference
      const formatsToSupport: Html5QrcodeSupportedFormats[] = [];
      if (scanMode === 'auto' || scanMode === 'qr') {
        formatsToSupport.push(Html5QrcodeSupportedFormats.QR_CODE);
      }
      if (scanMode === 'auto' || scanMode === 'barcode') {
        formatsToSupport.push(
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_39
        );
      }

      const html5Qrcode = new Html5Qrcode(readerId, {
        formatsToSupport,
        verbose: false
      });
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        cameraIdToUse,
        {
          fps: 15,
          // EAN/UPC barcodes are wider, qrbox can be custom shaped
          qrbox: (width, height) => {
            const size = Math.min(width, height);
            if (scanMode === 'qr') {
              const squareSize = Math.floor(size * 0.65);
              return { width: squareSize, height: squareSize };
            } else if (scanMode === 'barcode') {
              return {
                width: Math.floor(width * 0.8),
                height: Math.floor(size * 0.42),
              };
            } else {
              // Auto mode: wider box capable of catching both formats comfortably
              return {
                width: Math.floor(width * 0.75),
                height: Math.floor(size * 0.55),
              };
            }
          },
          aspectRatio: 1.333333,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
          stopScanner();
        },
        () => {
          // Silent verbose scanner ticks
        }
      );
      setCameraState('active');
    } catch (err: any) {
      console.error('Scanner start error:', err);
      setCameraState('error');
      setErrorMessage(err.message || 'Could not start camera feed. Please try simulated testing below.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping camera:', err);
      }
    }
  };

  useEffect(() => {
    if (activeCameraId) {
      startScanner(activeCameraId);
    }
    return () => {
      stopScanner();
    };
  }, [activeCameraId, scanMode]);

  const handleCameraChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setActiveCameraId(id);
  };

  const handleSimulatedScan = (code: string) => {
    handleScanSuccess(code);
  };

  return (
    <div id="barcode-scanner-overlay" className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden w-full max-w-xl shadow-2xl flex flex-col h-[90vh] md:h-auto md:max-h-[88vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 font-sans">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-blue-500/30 bg-blue-500/10 rounded-xl text-blue-400">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-lg">Omni Scanner Terminal</h3>
              <p className="text-xs text-slate-400">Scan standard 1D Barcodes & 2D QR Codes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute search sound' : 'Enable sound beep'}
              className={`p-2 rounded-xl transition duration-150 ${soundEnabled ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' : 'text-slate-500 bg-slate-800 border border-slate-700'}`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              id="close-scanner"
              onClick={onClose}
              className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Camera Container / Scanner Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Format Preference Tabs */}
          <div className="bg-slate-950/80 p-1 border border-slate-800/60 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setScanMode('auto')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-[10.5px] font-bold uppercase tracking-wider transition cursor-pointer ${
                scanMode === 'auto'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Auto Scan
            </button>
            <button
              type="button"
              onClick={() => setScanMode('barcode')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-[10.5px] font-bold uppercase tracking-wider transition cursor-pointer ${
                scanMode === 'barcode'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              1D Barcode
            </button>
            <button
              type="button"
              onClick={() => setScanMode('qr')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-[10.5px] font-bold uppercase tracking-wider transition cursor-pointer ${
                scanMode === 'qr'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              2D QR Code
            </button>
          </div>

          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 aspect-video overflow-hidden flex flex-col items-center justify-center">
            {/* Real HTML5 Reader */}
            <div id={readerId} className="absolute inset-0 w-full h-full object-cover z-0 [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />

            {/* Glowing Sight Box Overlay */}
            {cameraState === 'active' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 font-mono">
                {/* Dynamically Sized Scan box frame based on selected mode */}
                <div 
                  className={`border-2 border-dashed border-blue-500/55 rounded-xl relative flex items-center justify-center bg-blue-500/5 animate-pulse transition-all duration-300 ${
                    scanMode === 'qr' 
                      ? 'w-[52%] aspect-square' 
                      : scanMode === 'barcode'
                        ? 'w-[80%] h-[42%]'
                        : 'w-[75%] h-[55%]'
                  }`}
                >
                  {/* Glowing red scanner beam */}
                  <div className="absolute left-1.5 right-1.5 h-[2px] bg-red-400 shadow-[0_0_12px_#ef4444] animate-[bounce_2s_infinite]" />
                  
                  {/* Edge markers */}
                  <div className="absolute top-0 left-0 w-4.5 h-4.5 border-t-4 border-l-4 border-blue-500 -ml-[2px] -mt-[2px]" />
                  <div className="absolute top-0 right-0 w-4.5 h-4.5 border-t-4 border-r-4 border-blue-500 -mr-[2px] -mt-[2px]" />
                  <div className="absolute bottom-0 left-0 w-4.5 h-4.5 border-b-4 border-l-4 border-blue-500 -ml-[2px] -mb-[2px]" />
                  <div className="absolute bottom-0 right-0 w-4.5 h-4.5 border-b-4 border-r-4 border-blue-500 -mr-[2px] -mb-[2px]" />
                </div>
                
                <div className="mt-4 px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-[9.5px] text-blue-400 tracking-wider font-semibold uppercase">
                  {scanMode === 'qr' 
                    ? 'Align 2D QR Label Inside Scope' 
                    : scanMode === 'barcode' 
                      ? 'Align 1D Barcode Inside Scope' 
                      : 'Omnidirectional: Align Label Inside Scope'}
                </div>
              </div>
            )}

            {/* Camera Select and Error Status */}
            <AnimatePresence>
              {cameraState === 'idle' && (
                <div className="text-center p-4 z-10 flex flex-col items-center gap-2">
                  <Play className="w-8 h-8 text-blue-500 animate-pulse" />
                  <p className="text-slate-400 text-sm">Initializing camera feed...</p>
                </div>
              )}

              {cameraState === 'loading' && (
                <div className="text-center p-4 z-10 flex flex-col items-center gap-2">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                  <p className="text-slate-400 text-sm">Loading security camera frame...</p>
                </div>
              )}

              {cameraState === 'error' && (
                <div className="text-center p-6 z-10 max-w-sm flex flex-col items-center gap-3 pb-20 font-sans">
                  <AlertCircle className="w-10 h-10 text-amber-500" />
                  <h4 className="font-semibold text-amber-500">Iframe Camera Blocked</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Browser sandboxing in preview tabs often blocks camera access. 
                    Please use the **Omni Simulator Deck** below to instantly test scanning!
                  </p>
                </div>
              )}
            </AnimatePresence>

            {/* Last 5 Scanned Items Overlay */}
            {scanHistory.length > 0 && (
              <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-lg flex flex-col justify-center">
                <div className="flex items-center justify-between px-1 mb-1.5 font-sans">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                    <History className="w-3 h-3 text-indigo-400 animate-spin-slow" />
                    Scan History (Last 5)
                  </span>
                  <span className="text-[8px] text-slate-500 font-medium font-mono uppercase tracking-wider">Click to re-scan</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {scanHistory.map((code, idx) => {
                    const matchedProd = productsList.find(p => p.barcode === code || p.sku === code || p.id === code);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleScanSuccess(code)}
                        className="flex-shrink-0 px-3 py-1.5 bg-slate-950 border border-slate-850 hover:border-indigo-500/50 hover:bg-indigo-950/20 rounded-lg text-left transition duration-150 max-w-[120px] cursor-pointer"
                        title={`Click to re-scan ${code}`}
                      >
                        <div className="text-[10px] font-bold text-slate-200 truncate leading-snug font-sans">
                          {matchedProd ? matchedProd.name : code}
                        </div>
                        <div className="text-[8px] text-slate-500 font-mono truncate mt-0.5">
                          {matchedProd ? matchedProd.sku : 'Logistics Code'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Camera Selector (Only if active) */}
          {cameras.length > 1 && cameraState === 'active' && (
            <div className="flex items-center gap-3 bg-slate-850 p-3 border border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-400 font-medium">Capture Device:</span>
              <select
                value={activeCameraId}
                onChange={handleCameraChange}
                className="flex-1 bg-slate-900 border border-slate-700/60 rounded-xl px-2 py-1 text-xs text-slate-200 outline-none focus:border-blue-500"
              >
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Camera ${cameras.indexOf(cam) + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Simulator Panel - Highly helpful for preview validation */}
          <div className="border border-slate-800/80 rounded-2xl bg-slate-900/40 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Omni Simulator Deck
              </h4>
              <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full uppercase">
                Offline Sandbox Mode
              </span>
            </div>

            {/* Simulated Label Formats Selector */}
            <div className="flex border-b border-slate-800 pb-2 gap-3 text-xs font-medium">
              <button
                type="button"
                onClick={() => setSimulatorTab('1d')}
                className={`pb-1 px-1 transition relative ${
                  simulatorTab === '1d' ? 'text-indigo-400 border-b-2 border-indigo-500 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Product Barcodes (1D)
              </button>
              <button
                type="button"
                onClick={() => setSimulatorTab('2d')}
                className={`pb-1 px-1 transition relative ${
                  simulatorTab === '2d' ? 'text-indigo-400 border-b-2 border-indigo-500 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Logistics QR Labels (2D)
              </button>
            </div>

            {/* Quick-Scan Simulation Buttons (1D vs 2D Toggle Views) */}
            <AnimatePresence mode="wait">
              {simulatorTab === '1d' ? (
                <motion.div 
                  key="sim-1d"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1"
                >
                  {productsList.length > 0 ? (
                    productsList.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleSimulatedScan(prod.barcode)}
                        className="flex flex-col items-start p-2.5 border border-slate-800/80 hover:border-slate-700/70 bg-slate-900 hover:bg-slate-850/85 rounded-xl text-left transition duration-150 group"
                      >
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 truncate w-full">
                          {prod.name}
                        </span>
                        <span className="font-mono text-[9px] text-slate-500 mt-1 flex items-center justify-between w-full">
                          <span>[{prod.sku}]</span>
                          <span className="text-indigo-400 text-[9.5px] font-bold underline decoration-dotted">SCAN BARCODE</span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="col-span-2 text-xs text-slate-500 italic text-center py-4">No active products to list for simulation.</p>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="sim-2d"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1"
                >
                  {mockQRLabels.map((qr) => (
                    <button
                      key={qr.code}
                      type="button"
                      onClick={() => handleSimulatedScan(qr.code)}
                      className="flex flex-col items-start p-2.5 border border-slate-850 hover:border-indigo-900/40 bg-slate-900 hover:bg-slate-850/85 rounded-xl text-left transition duration-150 group"
                    >
                      <span className="text-xs font-semibold text-indigo-300 group-hover:text-cyan-400 truncate w-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        {qr.label}
                      </span>
                      <p className="text-[9.5px] text-slate-400 mt-1 line-clamp-1 w-full italic">
                        {qr.description}
                      </p>
                      <span className="font-mono text-[9px] text-slate-500 mt-2 flex items-center justify-between w-full">
                        <span className="text-[8px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded-md font-mono">{qr.code}</span>
                        <span className="text-indigo-400 text-[9.5px] font-bold underline decoration-dotted">SCAN QR</span>
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Manual Form Override */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <Keyboard className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Type SKU or QR payload code..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none placeholder-slate-600 transition"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (manualCode.trim()) {
                    handleSimulatedScan(manualCode.trim());
                    setManualCode('');
                  }
                }}
                disabled={!manualCode.trim()}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Scan Manual
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
