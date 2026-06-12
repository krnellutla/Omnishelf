/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, ChangeEvent } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Play, RefreshCw, AlertCircle, Sparkles, Volume2, VolumeX, Keyboard } from 'lucide-react';
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
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const readerId = 'barcode-camera-reader';

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
      const html5Qrcode = new Html5Qrcode(readerId);
      scannerRef.current = html5Qrcode;

      const formats = [
        0, // QR_CODE
        2, // EAN_13
        3, // EAN_8
        10, // CODE_128
        5, // UPC_A
        6, // UPC_E
        8, // CODE_39
      ];

      await html5Qrcode.start(
        cameraIdToUse,
        {
          fps: 12,
          // EAN/UPC barcodes are wider, qrbox can be custom shaped
          qrbox: (width, height) => {
            const size = Math.min(width, height);
            return {
              width: Math.floor(width * 0.8),
              height: Math.floor(size * 0.45),
            };
          },
          aspectRatio: 1.333333,
        },
        (decodedText) => {
          playBeep();
          onScanSuccess(decodedText);
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
    if (activeCameraId && cameraState === 'idle') {
      startScanner(activeCameraId);
    }
  }, [activeCameraId, cameraState]);

  const handleCameraChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setActiveCameraId(id);
    startScanner(id);
  };

  const handleSimulatedScan = (code: string) => {
    playBeep();
    onScanSuccess(code);
  };

  return (
    <div id="barcode-scanner-overlay" className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden w-full max-w-xl shadow-2xl flex flex-col h-[90vh] md:h-auto md:max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 font-sans">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-blue-500/30 bg-blue-500/10 rounded-xl text-blue-400">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-lg">Barcode Scanner</h3>
              <p className="text-xs text-slate-400">Scan UPC, EAN, or custom SKUs</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 aspect-video overflow-hidden flex flex-col items-center justify-center">
            {/* Real HTML5 Reader */}
            <div id={readerId} className="absolute inset-0 w-full h-full object-cover z-0 [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />

            {/* Glowing Sight Box Overlay */}
            {cameraState === 'active' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 font-mono">
                {/* Scan box frame */}
                <div className="w-[80%] h-[45%] border-2 border-dashed border-blue-500/50 rounded-lg relative flex items-center justify-center bg-blue-500/5 animate-pulse">
                  {/* Glowing red scanner beam */}
                  <div className="absolute left-1 right-1 h-[2px] bg-red-500 shadow-[0_0_12px_#ef4444] animate-[bounce_2s_infinite]" />
                  
                  {/* Edge markers */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 -ml-[2px] -mt-[2px]" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 -mr-[2px] -mt-[2px]" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 -ml-[2px] -mb-[2px]" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 -mr-[2px] -mb-[2px]" />
                </div>
                <div className="mt-4 px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-[10px] text-blue-400 tracking-wider font-semibold uppercase">
                  Align Barcode Inside Target
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
                <div className="text-center p-6 z-10 max-w-sm flex flex-col items-center gap-3">
                  <AlertCircle className="w-10 h-10 text-amber-500" />
                  <h4 className="font-semibold text-amber-500">Iframe Camera Blocked</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Browser sandboxing in preview tabs often blocks camera access. 
                    Please use the **Barcode Simulator Deck** below to instantly test scanning!
                  </p>
                </div>
              )}
            </AnimatePresence>
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
          <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Barcode Simulator Deck
              </h4>
              <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full uppercase">
                Offline Sandbox Mode
              </span>
            </div>

            <p className="text-xs text-slate-450 leading-relaxed">
              Click on any registered product below to simulate a real-world high speed laser scan, or type code manually.
            </p>

            {/* Quick-Scan Simulation Buttons */}
            {productsList.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 h-36 overflow-y-auto pr-1">
                {productsList.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => handleSimulatedScan(prod.barcode)}
                    className="flex flex-col items-start p-2.5 border border-slate-800 hover:border-slate-700/70 bg-slate-900 hover:bg-slate-800/80 rounded-xl text-left transition duration-150 group"
                  >
                    <span className="text-xs font-medium text-slate-250 group-hover:text-amber-400 truncate w-full">
                      {prod.name}
                    </span>
                    <span className="font-mono text-[9px] text-slate-500 mt-1 flex items-center justify-between w-full">
                      <span>[{prod.sku}]</span>
                      <span className="text-blue-400 text-[10px] underline decoration-dotted">SCAN</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-2">No active products to list for simulation.</p>
            )}

            {/* Manual Form Override */}
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <Keyboard className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Type alphanumeric barcode..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none placeholder-slate-600 transition"
                />
              </div>
              <button
                onClick={() => {
                  if (manualCode.trim()) {
                    handleSimulatedScan(manualCode.trim());
                    setManualCode('');
                  }
                }}
                disabled={!manualCode.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-semibold transition"
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
