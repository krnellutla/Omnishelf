# OmniShelf 📦✨

**OmniShelf** is an offline-first, enterprise-grade multi-tenant retail inventory ecosystem designed for high-volume distributors, boutiques, and grocers alike. Engineered with an automated barcode simulation scanner, strict multi-tenant ledger isolation, dynamic automatic local-to-cloud synchronization, and an intelligent stock replenishment planner. 

Built with **React**, **Vite**, **Tailwind CSS**, and powered by **Firebase Firestore**.

---

## 🚀 Core Features

### 🏢 Multi-Tenant Secure Isolation
* **Merchant Profiles**: Toggle between isolated merchant context slices (e.g., *Apex Retailers*, *Nova Lifestyle Goods*, *GreenSprout Grocery*).
* **Data Partitioning**: Transparently separates products, transaction logs, and alert bounds under distinct namespaces to ensure merchant security and compliance.
* **Corporate Profile Metrics**: Inline supplier metadata, localized visual badges, and material vendor details adjusted per tenant.

### 📶 Offline-First Cloud Ledger
* **Seamless Local Persistence**: Completely operational in full offline mode, recording operations directly to an optimized browser-local state.
* **Auto-Sync Queueing**: Maintains a synchronization queue that automatically uploads offline transactions and product ledger edits to Firebase Firestore the moment a network connection is re-established.
* **Visual Mode Toggle**: Includes a manual simulated network connection switcher to preview, test, and witness robust offline sync behaviors in real-time.

### 🔍 Integrated Barcode Scan Simulation
* **Camera Scanning**: Utilizes the user's camera (with standard browser permissions) to scan physical UPC, EAN, or SKU labels.
* **High-Density Scanner Panel**: A custom simulation board featuring popular products' preloaded barcodes for rapid, instant click-to-scan development testing.
* **Seamless Dispatching**: Instantly displays restock suggestions, updates existing SKU levels, or initializes a new product registration upon scan.

### 📊 Intelligent Replenish Planner
* **Critical Stock Indicators**: Live warning badges and pulsing indicators that alert operators about low inventory (below the custom threshold) or stockout items.
* **Smart Order Forms**: Interactive restock planners to generate material requests with active suppliers instantly.
* **Dynamic Audits**: Rich categorization filters, price/cost ledger displays, and automated total value tracking.

---

## 🛠️ Technology Stack

* **Frontend Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/) (lightning-fast construction and optimized production bundling)
* **Design & Theme Engine**: [Tailwind CSS v4](https://tailwindcss.com/) (elegant, micro-spaced, ultra-clean UI layouts)
* **Animation**: [Motion](https://motion.dev/) (fluid page transitions and micro-interactions)
* **Database & Persistence**: [Firebase Firestore](https://firebase.google.com/docs/firestore) + Standard Storage APIs
* **Icons**: [Lucide React](https://lucide.dev/)
* **Camera Recognition**: [HTML5 Qrcode Scanner](https://github.com/mebjas/html5-qrcode)

---

## 🏃 Getting Started

### 1. Requirements
Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) installed.

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/omnishelf.git
cd omnishelf
npm install
```

### 3. Environment Variables
OmniShelf uses Firebase to synchronize tenant records when online. Copy the example environment file and insert your configuration:
```bash
cp .env.example .env
```
Inside `.env`, populate your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Direct Development Run
To boot up the Vite local server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to interact with OmniShelf!

### 5. Production Compilation
Bundle the codebase to pre-optimized, standalone client files inside `dist/`:
```bash
npm run build
```

---

## 📂 Architecture Overview

```
├── src/
│   ├── components/
│   │   ├── BarcodeScanner.tsx        # Camera-based live scanner layout
│   │   ├── InventoryStats.tsx        # Bento-grid dynamic stat highlights & reorder controls
│   │   ├── ProductForm.tsx           # SKU register, details inspector & adjustment fields
│   │   └── TransactionsHistory.tsx   # Ledger audit search, filter tabs, and log cleaner
│   ├── utils/
│   │   ├── firebase.ts               # Cloud sync initialization handlers
│   │   └── localDB.ts                # Local storage read/write middleware with offline rules
│   ├── App.tsx                       # Main shell orchestrator, device simulator, theme panels
│   ├── types.ts                      # Shared types, structs, and interfaces
│   └── index.css                     # Global styles, Google Font imports, and Tailwind configuration
├── metadata.json                     # Applet configurations and major metadata settings
└── package.json                      # Build scripts and project dependencies
```

---

## 🔒 Security & Multi-Tenancy

Each database document is securely sequestered using custom Firebase Firestore rules. Database queries always partition data using the specific `tenantId` (e.g., `tenant-apex`, `tenant-nova`, or `tenant-greensprout`):
* **Read Constraints**: No profile is permitted to view or search the metrics or transaction logs of another profile namespace.
* **Offline Fallbacks**: While operating offline, `localStorage` safely tags actions with the corresponding tenant profile, syncing to the correct database container once the system boots back online.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
