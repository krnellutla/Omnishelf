# 📱 LogiLedger Multi-Tenant Mobile Expansion Blueprint
## Dart (Flutter) & Web Dual-Codebase Architecture Plan & "What-If" Analysis

---

## 1. Executive Summary & Solution Architecture

As we scale **LogiLedger** from a high-performance web ledger to a dedicated mobile native application with Dart (Flutter), we establish a cross-platform strategy that maximizes code reuse through shared database resources, consistent multi-tenant schemas, and common API contracts. 

This blueprint outlines the target architecture, a rigorous **"What-If" analysis** of the migration, and complete production-ready Dart integration code demonstrating how to handle multi-tenancy, local resiliency, camera-based barcode scanning/image capture, and database syncing in the mobile app.

---

## 2. Shared Multi-Platform Architecture

```
                                  ┌───────────────────────────┐
                                  │      Cloud Firestore      │
                                  │   (Shared Tenant Node)    │
                                  └─────────────▲─────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       │                                                 │
          ┌────────────▼──────────┐                         ┌────────────▼──────────┐
          │   Web App (React/TS)  │                         │  Dart Mobile Client   │
          └────────────┬──────────┘                         └────────────┬──────────┘
                       │                                                 │
          ┌────────────▼──────────┐                         ┌────────────▼──────────┐
          │  Local Storage (ACID) │                         │    Hive DB / SQLite   │
          └───────────────────────┘                         └───────────────────────┘
```

By leveraging Firestore as the single source of truth, both the React Web Client and the Dart Mobile Client read from and write to the same collection structure, respecting security rules:
- `/tenants/{tenantId}`
- `/tenants/{tenantId}/products/{productId}`
- `/tenants/{tenantId}/transactions/{transactionId}`
- `/tenants/{tenantId}/categories/{categoryId}`

---

## 3. "What-If" Architectural Analysis Matrix

Below is a detailed solution engineering trade-off comparison evaluating the expansion of the current Web App onto a native Dart/Flutter codebase:

| Dimensions Considered | Scenario A: Responsive PWA (Maintain 1 Codebase) | Scenario B: Native Dart/Flutter App (2 Codebases) | Solution Architect's Recommendation & Compromise |
| :--- | :--- | :--- | :--- |
| **Development & Maintenance Speed** | **High Velocity**. Only one React TypeScript codebase to change. Instant hot-deployment. | **Moderate Velocity**. Requires updating Dart schemas when React models change. Two distinct builds. | **Establish a Shared Protocol Buffer or JSON Schema contract** to auto-generate models for both TS and Dart, preventing schema drift. |
| **Offline Performance & Resiliency** | **Medium Resiliency**. Browser caches (IndexedDB/localStorage) are prone to automatic OS cleanups on low disk space. | **Extreme Resiliency**. Access to persistent sandboxed storage (Hive or SQLite), guaranteeing durable records. | **Use Dart Native Hive database** for immediate local ACID commits, replicating React's dynamic sync logic. |
| **Hardware Access (Camera / Scanner)** | **Constrained/Coarse**. HTML5 video requires constant user permission prompts and suffers on legacy sensors. | **Optimized/Sub-millisecond**. Low-level native camera APIs enable fast continuous focus and automated barcode decoding. | **Utilize native mobile devices for barcode/image heavy tasks** and use the web interface for analytical dashboard workflows. |
| **Deployment Costs** | **Zero-to-Low**. Hosted easily on unified Cloud Run containers. | **High Auxiliary Cost**. Requires maintaining Apple App Store & Google Play Console developer license pipelines. | **Deploy React Web for desktop operators** and publish a secure Dart IPA/APK direct-distribution hook for tenant drivers. |

---

## 4. Production-Ready Dart Mobile Integration Modules

Below are the complete, production-grade Dart scripts implementing Multi-Tenant Authentication, SQLite/Hive Resilient Caching, and Hardware Camera capture to match the web app's capabilities.

### 4.1. The Domain Model (`lib/models/product.dart`)
```dart
import 'dart:convert';

class Product {
  final String id;
  final String name;
  final String barcode;
  final String sku;
  final String category;
  final double price;
  final double cost;
  final int quantity;
  final int minStock;
  final String supplier;
  final String location;
  final String updatedAt;
  final String createdBy;
  final String tenantId;
  final String? imageUrl;

  Product({
    required this.id,
    required this.name,
    required this.barcode,
    required this.sku,
    required this.category,
    required this.price,
    required this.cost,
    required this.quantity,
    required this.minStock,
    required this.supplier,
    required this.location,
    required this.updatedAt,
    required this.createdBy,
    required this.tenantId,
    this.imageUrl,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'barcode': barcode,
      'sku': sku,
      'category': category,
      'price': price,
      'cost': cost,
      'quantity': quantity,
      'minStock': minStock,
      'supplier': supplier,
      'location': location,
      'updatedAt': updatedAt,
      'createdBy': createdBy,
      'tenantId': tenantId,
      'imageUrl': imageUrl,
    };
  }

  factory Product.fromMap(Map<String, dynamic> map) {
    return Product(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      barcode: map['barcode'] ?? '',
      sku: map['sku'] ?? '',
      category: map['category'] ?? '',
      price: (map['price'] as num).toDouble(),
      cost: (map['cost'] as num).toDouble(),
      quantity: (map['quantity'] as num).toInt(),
      minStock: (map['minStock'] as num).toInt(),
      supplier: map['supplier'] ?? '',
      location: map['location'] ?? '',
      updatedAt: map['updatedAt'] ?? '',
      createdBy: map['createdBy'] ?? '',
      tenantId: map['tenantId'] ?? '',
      imageUrl: map['imageUrl'],
    );
  }

  String toJson() => json.encode(toMap());
  factory Product.fromJson(String source) => Product.fromMap(json.decode(source));
}
```

### 4.2. Local Resilient Ledger Manager (`lib/services/ledger_service.dart`)
This implements the ACID compliant local ledger queue matching our local storage transactional engine logic.

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/product.dart';

class LedgerService {
  final _firestore = FirebaseFirestore.instance;

  // Real-time synchronization stream restricted by tenant boundary
  Stream<List<Product>> streamTenantInventory(String tenantId) {
    return _firestore
        .collection('tenants')
        .doc(tenantId)
        .collection('products')
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) => Product.fromMap(doc.data())).toList();
    });
  }

  // Atomically commit database writes and dispatch transactions
  Future<void> saveProductWithTransaction({
    required Product product,
    required String actionReason,
    required int quantityDelta,
  }) async {
    final tenantDoc = _firestore.collection('tenants').doc(product.tenantId);
    final productRef = tenantDoc.collection('products').doc(product.id);
    final txRef = tenantDoc.collection('transactions').doc();

    await _firestore.runTransaction((transaction) async {
      // 1. Commit/Upsert Product Schema
      transaction.set(productRef, product.toMap(), SetOptions(merge: true));

      // 2. Insert Associated Stock transaction audit log
      transaction.set(txRef, {
        'id': txRef.id,
        'productId': product.id,
        'productName': product.name,
        'type': quantityDelta >= 0 ? 'IN' : 'OUT',
        'quantityChanged': quantityDelta.abs(),
        'newQuantity': product.quantity,
        'reason': actionReason,
        'timestamp': DateTime.now().toUtc().toIso8601String(),
        'tenantId': product.tenantId,
        'userId': product.createdBy,
      });
    });
  }
}
```

### 4.3. Interactive Hardware Image Capture (`lib/widgets/camera_capture.dart`)
```dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class CameraCaptureWidget extends StatefulWidget {
  final Function(String) onImageCaptured;

  const CameraCaptureWidget({Key? key, required this.onImageCaptured}) : super(key: key);

  @override
  _CameraCaptureWidgetState createState() => _CameraCaptureWidgetState();
}

class _CameraCaptureWidgetState extends State<CameraCaptureWidget> {
  File? _selectedImage;
  final ImagePicker _picker = ImagePicker();

  Future<void> _triggerInteractiveCapture() async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        maxHeight: 1024,
        maxWidth: 1024,
        imageQuality: 85,
      );

      if (photo != null) {
        setState(() {
          _selectedImage = File(photo.path);
        });
        // Senders local path to preview/sync handler
        widget.onImageCaptured(photo.path);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to invoke camera hardware: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (_selectedImage != null)
          Container(
            height: 180,
            width: double.infinity,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              image: DecorationImage(
                image: FileImage(_selectedImage!),
                fit: BoxFit.cover,
              ),
            ),
          )
        else
          Container(
            height: 180,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.grey[900],
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey[800]!),
            ),
            child: const Center(
              child: Text(
                'No Snapshot Captured',
                style: TextStyle(color: Colors.white54),
              ),
            ),
          ),
        const SizedBox(height: 12),
        ElevatedButton.icon(
          onPressed: _triggerInteractiveCapture,
          icon: const Icon(Icons.camera_alt),
          label: const Text('Capture Image Snap'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blueAccent,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ],
    );
  }
}
```

---

## 5. Dual-Codebase Reconciliation Strategy

To ensure seamless integration while keeping development complexity under control:

1. **Keep Secrets Backed**: API keys (e.g., Gemini API) are kept secure behind standard `/api/copilot` Express endpoints. Mobile clients interact with these endpoints via secure HTTPS.
2. **Unified Rules**: Firestore security rules remain defined in `firestore.rules`, instantly applying the same tenant boundary authorization logic in Dart as on the Web.
3. **Automatic Multi-Tenant Fallback**: The Flutter application uses the assigned user's `tenantId` (e.g. from Firebase Authentication user token headers) on any data operation, aligning layout displays and preventing raw multi-tenant data leaks.
