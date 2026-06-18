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

### 🔍 Omni Scanner Terminal (1D Barcodes & 2D QR Codes)
* **Dual-Format Support**: Upgraded camera-based scanner to recognize both standard 1D linear barcodes (EAN, UPC, Code 128) and newer 2D high-density QR Code labels.
* **Flexible Scanning Presets**: Toggleable scan mode selectors (Auto Scan, 1D Barcode, 2D QR) matching designated responsive reticle dimensions and glowing laser sights.
* **Omni Simulator Deck**: Built-in test sandbox containing mock product standard barcodes (1D) and logistics bin/batch allocation codes (2D) for rapid software testing inside sandboxed web environments.
* **Manual Override field**: Allows rapid keyin or mock barcode emulation directly into the processing routine with a built-in beep sound simulator.

### 🎨 Universal Theme Switcher & Dark Mode
* **Instant Toggle**: Single-click dark/light mode toggle in the universal header bar that persists selections automatically inside `localStorage`.
* **Tailored Color Hierarchies**: Beautifully customized deep space slate palettes and high-contrast card structures across all dashboards, filters, text nodes, modal popups, and Recharts graph panels.
* **Zero Flash Glare**: Configured custom root CSS overrides to ensure smooth transitions without layout fuming or rendering lag.

### 📈 Intelligent Replenish Planner & 7-Day Burn Analytics
* **Predictive Stockouts**: Automatically runs a dynamic analytics suite calculating individual SKU daily/weekly burn rates by isolating past `OUT` transaction counts and dates.
* **Days-to-Cover Dashboard**: A prominent live risk board displaying time remaining before breaching custom minimum safe stock (e.g., "X days", "Already Depleted").
* **Click-to-Replenish dispatch**: Fast action button that instantly preloads Copilot with pre-computed logistics metrics (current inventory, safety bounds, weekly burn rate, projected buffer days) to write supplier replenishment orders.

### 🖼️ Product Media & Thumbnail URL Integration
* **Placeholder Image URL**: Custom defined optional thumbnail URLs customizable per product directly within the registration & modification panels.
* **Inline Data Grid Visuals**: Elegant image thumbnails embedded into inventory lists on desktop grids and interactive mobile listings with automatic image fallback handlers.

### 🔔 Visual Threshold Alert Center & Immediate Toasts
* **Safety Stock Center**: Built-in warning dropdown drawer toggled via the main header's bell notification icon exhibiting low-stock status indicators and active SKU targets.
* **Immediate Popups Portal**: Bottom right floating action panel immediately triggering highly visible real-time warning toasts if manual edit or transaction checkout decreases quantity below safety minimum stock.
* **Instant Restock Shortcut**: Full system integration allowing rapid one-click automated supplier replenishment order dispatch directly from the warning drawers and notification cards.

### 🎓 Zero-Knowledge Onboarding & Interactive Setup Wizard (The Perfect Consumer Hook)
* **Guided Setup Tour**: A gorgeous five-step visual configuration wizard designed specifically for non-technical operators. It acts as an engaging consumer hook on the very first visit, helping them configure identity, custom categories, and safety stock points without any tech friction.
* **Automated Data Seed Catalyst**: Lets clients initialize their catalog either as a clean-sweep fresh slate or pre-fill it with simulated low-stock trial items to see visual alert centers work in real-time.
* **Persistent Launchpad**: Mounted in the header as a dedicated "Setup & Test Wizard" button allowing clients to reset or recheck configuration states on-demand.

### 🧪 Automated Live Diagnostics & Unit Testing (UX + API Integrity Checkers)
* **Live In-App Diagnostic Runner**: Runs automated UX and API compliance checks inside the Setup Wizard. Newly onboarded clients click a button to execute a live system check (localStorage write speeds, cloud sync triggers, notification rule paths, and viewport layouts) and view real-time log outputs.
* **Command-Line Vitest Framework**: Complete end-to-end automated unit test scripts (`/src/utils/localDB.test.ts`) integrated with Vitest. Run `npm run test` or `npx vitest run` to verify data consistency and transactional inventory ledger checks.

### 📱 Flutter Native Mobile Companion (Dart & SQLite Expansion)
* **Dual-Codebase Architecture**: Scale from full-screen web workstations to local mobile hardware using a unified Firestore API and database contract.
* **SQLite Relational Engine**: Embedded `sqflite` database handles local transactions natively with full ACID compliance—ensuring low-connectivity resilience in remote warehouses/delivery trucks.
* **Mobile-Optimized Cards & Pull-to-Refresh**: Modern mobile Material 3 product inventory listings (`ProductListView`) supporting pull-to-refresh to pull down values from Firestore, alongside a floating quick camera snapshot action.
* **Anti-Leak Tenant Scoping**: All local SQLite transactions and searches are dynamically restricted using the logged-in merchant's `tenantId` to guarantee complete tenant isolation on shared mobile devices.

---

## 🛠️ Technology Stack

* **Frontend Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/) (lightning-fast construction and optimized production bundling)
* **Design & Theme Engine**: [Tailwind CSS v4](https://tailwindcss.com/) (elegant, micro-spaced, ultra-clean UI layouts)
* **Animation**: [Motion](https://motion.dev/) (fluid page transitions and micro-interactions)
* **Mobile App SDK**: [Flutter (Dart)](https://flutter.dev/) (modern, high-fidelity Material 3 native application)
* **Mobile Database & Persistence**: SQLite (`sqflite` in Dart) supporting relational storage indices
* **Database & Cloud Persistence**: [Firebase Firestore](https://firebase.google.com/docs/firestore) + Standard Storage APIs
* **Icons**: [Lucide React](https://lucide.dev/) + Cupertino Icons in Flutter
* **Camera Recognition**: [HTML5 Qrcode Scanner](https://github.com/mebjas/html5-qrcode) + Native Mobile Device Camera Picker

---

## 🏃 Getting Started

### 1. Requirements
Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) and the [Flutter SDK](https://docs.flutter.dev/get-started/install) installed.

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
├── src/                               # 🖥️ React Web Workspace
│   ├── components/
│   │   ├── BarcodeScanner.tsx         # Camera-based live scanner layout
│   │   ├── InventoryStats.tsx         # Bento-grid dynamic stat highlights & reorder controls
│   │   ├── ProductForm.tsx            # SKU register, details inspector & adjustment fields
│   │   └── TransactionsHistory.tsx    # Ledger audit search, filter tabs, and log cleaner
│   ├── utils/
│   │   ├── firebase.ts                # Cloud sync initialization handlers
│   │   └── localDB.ts                 # Local storage read/write middleware with offline rules
│   ├── App.tsx                        # Main shell orchestrator, device simulator, theme panels
│   ├── types.ts                       # Shared types, structs, and interfaces
│   └── index.css                      # Global styles, Google Font imports, and Tailwind configuration
├── flutter_app/                       # 📱 Flutter Native Mobile Workspace
│   ├── pubspec.yaml                   # Flutter dependency manager configuration
│   ├── lib/
│   │   ├── main.dart                  # Mobile application bootstrapper & M3 theme definitions
│   │   ├── helpers/
│   │   │   └── database_helper.dart   # SQLite initialization & database tables creation 
│   │   ├── models/
│   │   │   └── product.dart           # Production-ready dual-platform Product domain model
│   │   ├── repositories/
│   │   │   └── inventory_repository.dart # Local ACID transaction transaction process manager
│   │   └── widgets/
│   │       ├── camera_capture.dart    # Devices Sandbox Camera handler & fallback mocks
│   │       ├── dashboard.dart         # Multi-tenant search controls & check-in flow panels
│   │       └── product_list_view.dart  # Mobile Card Layout with pull-to-refresh integration
├── metadata.json                      # Applet configurations and major metadata settings
└── package.json                       # Build scripts and project dependencies
```

---

## 🔒 Security & Multi-Tenancy

Each database document is securely sequestered using custom Firebase Firestore rules. Database queries always partition data using the specific `tenantId` (e.g., `tenant-apex`, `tenant-nova`, or `tenant-greensprout`):
* **Read Constraints**: No profile is permitted to view or search the metrics or transaction logs of another profile namespace.
* **Offline Fallbacks**: While operating offline, `localStorage` safely tags actions with the corresponding tenant profile, syncing to the correct database container once the system boots back online.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
