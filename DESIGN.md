# OmniShelf Product Design Blueprint & Roadmap

OmniShelf is a next-generation, multi-tenant enterprise logistics platform designed for high-throughput retail stores. It features a modern, ultra-reliable offline-first ledger, interactive carrier integrations, three-way cost matching, physical cycle counting, and built-in hardware simulators.

---

## 🏛️ System Architecture

OmniShelf employs a robust full-stack architected layout:
- **Client Tier**: Fully-featured React SPA utilizing high-density tailwind layouts, responsive animations via `motion`, and an adaptive emulator view (Mobile App, Desktop Dashboard, Responsive Auto).
- **Offline Ledger**: Key-value store leveraging local database utilities (`localStorage`) with a virtual sync queue. When online, changes bubble directly to Firestore; when offline, changes accumulate and synchronize upon network restoration.
- **Backend Service**: An Express.js microservice hosting our API routers, static builds, and server-side model proxies.
- **AI Intelligence**: Server-side client utilizing the `@google/genai` SDK to connect with Google Gemini (`gemini-3.5-flash`), keeping credentials remote and isolated.

---

## 🗺️ Phase-by-Phase Roadmap

### 📦 Phase 1: Ledger Core & Offline Synchronization (*Completed*)
- **Tenant Context Isolation**: Dynamic profile shifting (e.g., Apex Retail, Summit Apparel) with isolated database state scopes.
- **Offline-First Synchronization**: Automatic internet connectivity sensing, pending-synchronization tracker queue, manual cloud resolution trigger.
- **State Listeners**: Seamless Firestore database synchronization with local memory state fallback.

### 🏭 Phase 2: Enterprise Logistics Gateway (*Completed*)
- **Procurement Hub (PO)**: Automated reorder drafting for low-stock items. Custom 3-way matching engine validating supplier invoices against physical receipt quantities.
- **Cycle Counts**: Expiry-aware counting sessions with Lot, Serial Number, and Bin Location tagging.
- **Order Fulfillment Box**: Interactive picking, packing, routing, and real-time shipping carrier API simulation.
- **Webhooks & Telemetry**: Dynamic REST hooks simulation capturing inventory logs and alerting downstream services.

### 🧠 Phase 3: AI Intelligence Copilot & Auto-Scribing (*Active Implementation*)
- **Interactive AI Copilot Panel**: Custom floating drawer and modular sidebar workspace.
- **Live Inventory Context Feed**: Passes structured SKU listings, category metadata, and active transaction histories.
- **AI Analytics & Explanations**: 
  - Synthesize product stock anomalies.
  - Suggest carrier routes based on log analyses.
  - Generate automated draft supplier emails and replenishment orders.
  - Analyze transactions to spot inventory shrinkage.

---

## 🎨 Visual Identity & Styling

OmniShelf utilizes a highly distinct, professional color pairing system:
- **Primary Canvas**: Soft, clean off-whites (`bg-[#F3F4F6]`) paired with crisp white panels (`bg-white`) designed for eye longevity.
- **Accents**: Deep midnight-blue (`text-slate-900`) headings, paired with technical emerald (`text-emerald-550`) and sapphire (`text-blue-650`) highlight cues.
- **Mono Details**: JetBrains Mono code-lines for hardware readouts and audit states, removing unneeded visual clutter.
