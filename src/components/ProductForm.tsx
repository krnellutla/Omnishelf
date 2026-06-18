/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { X, Barcode, HelpCircle, Sparkles, FolderPlus, Info, Save, RotateCcw, Camera, CameraOff } from 'lucide-react';
import { Product, Category } from '../types';

interface ProductFormProps {
  product?: Product | null;
  onSave: (product: Product, reason?: string) => void;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (category: Category) => void;
  existingProducts?: Product[];
}

export default function ProductForm({
  product,
  onSave,
  onClose,
  categories,
  onAddCategory,
  existingProducts = []
}: ProductFormProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('0.00');
  const [cost, setCost] = useState('0.00');
  const [quantity, setQuantity] = useState('0');
  const [minStock, setMinStock] = useState('5');
  const [supplier, setSupplier] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Real-time Camera integration state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto clean-up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera capture access failed:', err);
      setCameraError('Unable to access camera hardware. Verify hardware access permissions or provide raw URL.');
      setIsCameraActive(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          setImageUrl(dataUrl);
          stopCamera();
        }
      } catch (err) {
        console.error('Failed to capture frame reference:', err);
        setCameraError('Failed to capture picture snapshot.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };
  
  const [newCatName, setNewCatName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [reason, setReason] = useState('');

  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'restored'>('idle');

  const isEdit = !!product;

  const isSkuDuplicate = !isEdit && existingProducts.some(
    p => p.sku.trim().toLowerCase() === sku.trim().toLowerCase()
  );

  const handleResetToDefault = () => {
    const key = product ? `logiledger_draft_edit_${product.id}` : 'logiledger_draft_new';
    localStorage.removeItem(key);
    
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setBarcode(product.barcode);
      setCategory(product.category);
      setPrice(product.price.toString());
      setCost(product.cost.toString());
      setQuantity(product.quantity.toString());
      setMinStock(product.minStock.toString());
      setSupplier(product.supplier);
      setLocation(product.location);
      setImageUrl(product.imageUrl || '');
      setReason('');
    } else {
      setName('');
      const tempId = Math.floor(100000 + Math.random() * 900000).toString();
      setSku(`SKU-${tempId}`);
      setBarcode(`4006381${tempId}`);
      setCategory(categories[0]?.name || 'Electronics');
      setPrice('10.00');
      setCost('5.00');
      setQuantity('10');
      setMinStock('5');
      setSupplier('');
      setLocation('');
      setImageUrl('');
      setReason('');
    }
    setAutoSaveStatus('idle');
  };

  // Sync state or restore draft if found in localStorage
  useEffect(() => {
    const key = product ? `logiledger_draft_edit_${product.id}` : 'logiledger_draft_new';
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setName(parsed.name ?? '');
        setSku(parsed.sku ?? '');
        setBarcode(parsed.barcode ?? '');
        setCategory(parsed.category ?? '');
        setPrice(parsed.price ?? '0.00');
        setCost(parsed.cost ?? '0.00');
        setQuantity(parsed.quantity ?? '0');
        setMinStock(parsed.minStock ?? '5');
        setSupplier(parsed.supplier ?? '');
        setLocation(parsed.location ?? '');
        setImageUrl(parsed.imageUrl ?? '');
        setReason(parsed.reason ?? '');
        setAutoSaveStatus('restored');
        // Let it fade out slightly later
        const timer = setTimeout(() => setAutoSaveStatus('idle'), 4500);
        return () => clearTimeout(timer);
      } catch (e) {
        console.warn('Could not parse saved draft', e);
      }
    }

    if (product) {
      setName(product.name);
      setSku(product.sku);
      setBarcode(product.barcode);
      setCategory(product.category);
      setPrice(product.price.toString());
      setCost(product.cost.toString());
      setQuantity(product.quantity.toString());
      setMinStock(product.minStock.toString());
      setSupplier(product.supplier);
      setLocation(product.location);
      setImageUrl(product.imageUrl || '');
      setReason('');
    } else {
      setName('');
      const tempId = Math.floor(100000 + Math.random() * 900000).toString();
      setSku(`SKU-${tempId}`);
      setBarcode(`4006381${tempId}`);
      setCategory(categories[0]?.name || 'Electronics');
      setPrice('10.00');
      setCost('5.00');
      setQuantity('10');
      setMinStock('5');
      setSupplier('');
      setLocation('');
      setImageUrl('');
      setReason('');
    }
  }, [product?.id, categories]);

  // Periodic Auto-Save Draft to localStorage (Runs every 4 seconds when any value changes)
  useEffect(() => {
    // Check if we have any editable user content before triggering save
    const hasValues = !!(name || supplier || location || reason || category || imageUrl);
    if (!hasValues) return;

    const interval = setInterval(() => {
      const key = product ? `logiledger_draft_edit_${product.id}` : 'logiledger_draft_new';
      
      const draftData = {
        name,
        sku,
        barcode,
        category,
        price,
        cost,
        quantity,
        minStock,
        supplier,
        location,
        imageUrl,
        reason
      };

      localStorage.setItem(key, JSON.stringify(draftData));
      setAutoSaveStatus('saved');
      const timer = setTimeout(() => setAutoSaveStatus('idle'), 1500);
      return () => clearTimeout(timer);
    }, 4000);

    return () => clearInterval(interval);
  }, [product?.id, name, sku, barcode, category, price, cost, quantity, minStock, supplier, location, imageUrl, reason]);

  // Handle dynamic SKU generation if typing name (only when creating)
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isEdit && val) {
      // Create a neat initial SKU based on name
      const prefix = val.trim().substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'SKU');
      const cleanPrefix = prefix.length >= 2 ? prefix : 'SKU';
      const randomPart = Math.floor(100 + Math.random() * 900);
      setSku(`${cleanPrefix}-${randomPart}`);
    }
  };

  const handleCreateCategory = (e: FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    const duplicate = categories.find(c => c.name.toLowerCase() === newCatName.trim().toLowerCase());
    if (duplicate) {
      setCategory(duplicate.name);
      setShowAddCat(false);
      setNewCatName('');
      return;
    }

    const newCat: Category = {
      id: `cat-${Math.random().toString(36).substr(2, 9)}`,
      name: newCatName.trim(),
      description: 'Custom added retail product category',
      createdBy: 'user'
    };

    onAddCategory(newCat);
    setCategory(newCat.name);
    setNewCatName('');
    setShowAddCat(false);
  };

  const handleGenerateBarcode = () => {
    // Generate a proper UPC / EAN standard looking code
    const random12 = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    setBarcode(random12);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (isSkuDuplicate) return;

    const parsedProduct: Product = {
      id: product?.id || `prod-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      sku: sku.trim() || 'SKU-GEN',
      barcode: barcode.trim() || 'NO-BARCODE',
      category: category || 'General',
      price: Math.max(0, parseFloat(price) || 0),
      cost: Math.max(0, parseFloat(cost) || 0),
      quantity: Math.max(0, parseInt(quantity, 10) || 0),
      minStock: Math.max(0, parseInt(minStock, 10) || 0),
      supplier: supplier.trim() || 'N/A',
      location: location.trim() || 'Default Shelf',
      imageUrl: imageUrl.trim() || undefined,
      updatedAt: new Date().toISOString(),
      createdBy: product?.createdBy || 'tester-user'
    };

    const key = product ? `logiledger_draft_edit_${product.id}` : 'logiledger_draft_new';
    localStorage.removeItem(key);

    onSave(parsedProduct, reason.trim() || undefined);
  };

  return (
    <div id="product-form-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
          <div>
            <h3 className="font-semibold text-slate-100 text-lg">
              {isEdit ? `Modify Product: ${product.name}` : 'Intake New Product'}
            </h3>
            <p className="text-xs text-slate-400">Specify details, prices, and warehouse locations</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-slate-800 hover:border-slate-705 bg-slate-850 text-slate-400 hover:text-slate-200 rounded-lg transition duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Identity Block */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400">Product Identity</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leather Office Folder"
                  value={name}
                  onChange={handleNameChange}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-slate-250 outline-none transition"
                />
              </div>

              {/* Unique SKU */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">SKU (Stock Keeping Unit)</label>
                <input
                  type="text"
                  placeholder="AUTO-GENERATED"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className={`bg-slate-950 border ${isSkuDuplicate ? 'border-red-500 hover:border-red-500 focus:border-red-500 ring-2 ring-red-500/10' : 'border-slate-800 hover:border-slate-700 focus:border-blue-500'} rounded-xl px-3.5 py-2 text-xs text-slate-250 font-mono outline-none transition`}
                />
                {isSkuDuplicate && (
                  <p className="text-[10px] text-red-400 font-medium mt-0.5">
                    This SKU is already registered in your active database.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Barcode Section */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium flex items-center justify-between">
                  <span>UPC/EAN Barcode</span>
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" /> Generate
                  </button>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                    <Barcode className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="EAN-13 or manual digital code"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-250 font-mono outline-none transition"
                  />
                </div>
              </div>

              {/* Dynamic Category Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium flex items-center justify-between">
                  <span>Department / Category</span>
                  <button
                    type="button"
                    onClick={() => setShowAddCat(!showAddCat)}
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <FolderPlus className="w-3 h-3" /> Create New
                  </button>
                </label>
                
                {showAddCat ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New category..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-amber-500/50 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-slate-250 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-semibold hover:shadow-lg transition"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCat(false)}
                      className="p-1.5 border border-slate-800 text-slate-400 rounded-xl hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-250 outline-none transition"
                  >
                    <option value="" disabled>Choose department...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Stock counts */}
          <div className="space-y-4 pt-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400">Cost & Stock Levels</h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Unit Cost */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">Unit Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-slate-250 outline-none transition"
                />
              </div>

              {/* Retail Price */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">Retail Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-slate-250 outline-none transition"
                />
              </div>

              {/* Stock Quantity */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">Stock On Hand</label>
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-slate-250 outline-none transition"
                />
              </div>

              {/* Reorder Threshold */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">Low Stock Point (Min)</label>
                <input
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-slate-250 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Logistics */}
          <div className="space-y-4 pt-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400">Logistics, Sourcing & Media</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Supplier */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">Supplier / Vendor</label>
                <input
                  type="text"
                  placeholder="e.g. Peak Sourcing Co."
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-slate-250 outline-none transition"
                />
              </div>

              {/* Location in store */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">Storage / Display Location</label>
                <input
                  type="text"
                  placeholder="e.g. Aisle 4, Bottom Drawer"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-slate-250 outline-none transition"
                />
              </div>

              {/* Product Image URL & Camera Interface */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs text-slate-400 font-medium flex items-center justify-between">
                  <span>Product Image Thumbnail & Camera Sourcing</span>
                  {imageUrl && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      ● Active Image Loaded
                    </span>
                  )}
                </label>
                
                {/* Real-time Camera Viewframe */}
                {isCameraActive ? (
                  <div className="relative border border-blue-500 bg-slate-900 rounded-2xl p-2.5 flex flex-col items-center gap-2.5 overflow-hidden shadow-lg">
                    <div className="relative w-full max-w-md h-52 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover transform scale-x-100"
                        playsInline
                        muted
                        autoPlay
                      />
                      {/* Grid Target Sighter */}
                      <div className="absolute inset-0 border-2 border-dashed border-blue-500/30 rounded-lg pointer-events-none m-4 flex items-center justify-center animate-pulse">
                        <div className="text-[10px] text-blue-400 bg-slate-950/80 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                          Align product within sighter
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={captureImage}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Capture Snap</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Paste image URL (Optional)"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-slate-250 outline-none transition"
                      />
                      
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-blue-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer"
                        title="Activate webcam to register product design snapshots immediately"
                      >
                        <Camera className="w-4 h-4 text-blue-500" />
                        <span>Interactive Capture</span>
                      </button>

                      {imageUrl && (
                        <div className="w-9 h-9 border border-slate-800 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-xs relative group">
                          <img
                            src={imageUrl}
                            alt="Preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://placehold.co/100x100?text=Error";
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {cameraError && (
                      <p className="text-[10px] text-amber-500 font-medium">
                        ⚠️ {cameraError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Audit Note / Transaction Reason */}
          <div className="space-y-4 pt-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-500" /> Audit Logging
            </h4>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Stock Change Action Note (Optional)</label>
              <input
                type="text"
                placeholder={isEdit ? "Why are you updating this stock? e.g. Count realignment, Supplier order" : "e.g. Opening stock ingest"}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-amber-500/50 rounded-xl px-3.5 py-2 text-xs text-slate-250 outline-none transition"
              />
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-950/20 flex items-center justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-[10px] text-slate-400 italic">
              * Indicates required fields
            </span>
            {autoSaveStatus !== 'idle' && (
              <span className={`text-[10.5px] font-semibold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 transition-all duration-300 ${
                autoSaveStatus === 'saving' || autoSaveStatus === 'saved'
                  ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400 animate-pulse'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
              }`}>
                {autoSaveStatus === 'saving' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                    Saving Draft...
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Draft Auto-Saved
                  </>
                )}
                {autoSaveStatus === 'restored' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Draft Restored
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      className="ml-1.5 text-[9px] hover:text-red-400 hover:underline cursor-pointer flex items-center gap-0.5 font-bold uppercase tracking-wider text-amber-400/80"
                      title="Discard local backup"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Discard
                    </button>
                  </>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!name.trim() || isSkuDuplicate}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-900/10 hover:shadow-blue-900/30 transition duration-150"
            >
              Save Product Information
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
