import 'package:flutter/material.dart';
import '../models/product.dart';
import '../repositories/inventory_repository.dart';
import 'camera_capture.dart';
import 'product_list_view.dart';

class TenantInventoryDashboard extends StatefulWidget {
  final String activeTenantId;

  const TenantInventoryDashboard({Key? key, required this.activeTenantId}) : super(key: key);

  @override
  State<TenantInventoryDashboard> createState() => _TenantInventoryDashboardState();
}

class _TenantInventoryDashboardState extends State<TenantInventoryDashboard> {
  final InventoryRepository _repo = InventoryRepository();
  bool _isOnline = true;
  List<Product> _products = [];
  int _unsyncedQueueSize = 0;
  String _searchQuery = '';
  String? _selectedCategory;

  @override
  void initState() {
    super.initState();
    _initAndLoad();
  }

  Future<void> _initAndLoad() async {
    // Fill demo products if DB is empty
    await _repo.seedDemoProducts(widget.activeTenantId);
    await _refreshLocalData();
  }

  Future<void> _refreshLocalData() async {
    final products = await _repo.getProductsForTenant(widget.activeTenantId);
    final unsynced = await _repo.getUnsyncedAssets();

    setState(() {
      _products = products;
      _unsyncedQueueSize = unsynced.length;
    });
  }

  // Trigger Local Sync Operation with Cloud nodes
  void _syncWithCloud() async {
    setState(() {
      _isOnline = false; // Mocking busy sync wheel
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Pushing local ledger to Cloud servers...'),
        behavior: SnackBarBehavior.floating,
      ),
    );

    final pending = await _repo.getUnsyncedAssets();
    for (var tx in pending) {
      // Simulate network request latency
      await Future.delayed(const Duration(milliseconds: 300));
      await _repo.markAsSynced(tx['id']);
    }

    await _refreshLocalData();
    setState(() {
      _isOnline = true;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('All regional logs synchronized successfully!'),
        backgroundColor: Colors.emerald,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showAdjustInventorySheet(Product product) {
    int transQty = 1;
    String transType = 'IN';
    final reasonController = TextEditingController(text: 'Mobile check-in');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E293B), // Slate-800
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
                left: 20,
                right: 20,
                top: 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              product.name,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              'SKU: ${product.sku}',
                              style: const TextStyle(color: Colors.white38, fontSize: 11, fontFamily: 'monospace'),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close, color: Colors.grey),
                      )
                    ],
                  ),
                  const Divider(color: Colors.white10, height: 24),
                  
                  // Transaction Type Selection Segment
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => setSheetState(() => transType = 'IN'),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: transType == 'IN' ? Colors.emerald : Colors.white10,
                            ),
                            backgroundColor: transType == 'IN' ? Colors.emerald.withOpacity(0.12) : Colors.transparent,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('CHECK-IN (+)'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => setSheetState(() => transType = 'OUT'),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: transType == 'OUT' ? Colors.redAccent : Colors.white10,
                            ),
                            backgroundColor: transType == 'OUT' ? Colors.redAccent.withOpacity(0.12) : Colors.transparent,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('CHECK-OUT (-)'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Interactive Digital Meter Selector
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      IconButton(
                        onPressed: () {
                          if (transQty > 1) {
                            setSheetState(() => transQty--);
                          }
                        },
                        icon: const Icon(Icons.remove_circle_outline, color: Colors.white54, size: 28),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F172A),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '$transQty',
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                      IconButton(
                        onPressed: () {
                          setSheetState(() => transQty++);
                        },
                        icon: const Icon(Icons.add_circle_outline, color: Colors.white54, size: 28),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Log Entry note fields
                  TextField(
                    controller: reasonController,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      labelText: 'Audit Action Reason Notes / Logs',
                      labelStyle: const TextStyle(color: Colors.grey, fontSize: 12),
                      filled: true,
                      fillColor: const Color(0xFF0F172A),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  ElevatedButton(
                    onPressed: () async {
                      await _repo.processAdjustInventory(
                        product: product,
                        adjustmentQty: transQty,
                        type: transType,
                        reason: reasonController.text,
                        userId: 'mobile-agent-user',
                      );
                      Navigator.pop(context);
                      _refreshLocalData();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: transType == 'IN' ? Colors.emerald : Colors.redAccent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text('LOG TRANSACTION IN LEDGER'),
                  )
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Filter Products dynamically of current tenant
    final filtered = _products.where((item) {
      final matchesSearch = item.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          item.sku.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          item.location.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesSearch;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Cosmic Slate Premium Dark Backing
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'LogiLedger Multi-Tenant Mobile',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Row(
              children: [
                const Icon(Icons.domain, size: 10, color: Colors.blueGrey),
                const SizedBox(width: 4),
                Text(
                  'Scope ID: ${widget.activeTenantId}',
                  style: const TextStyle(fontSize: 10, color: Colors.blueGrey, fontFamily: 'monospace'),
                ),
              ],
            ),
          ],
        ),
        actions: [
          // Synchronous Pill Mode Switcher
          Container(
            margin: const EdgeInsets.symmetric(vertical: 11, horizontal: 8),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: _isOnline ? Colors.emerald.withOpacity(0.12) : Colors.amber.withOpacity(0.12),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: _isOnline ? Colors.emerald.withOpacity(0.5) : Colors.amber.withOpacity(0.5),
                width: 1,
              ),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 3,
                  backgroundColor: _isOnline ? Colors.emerald : Colors.amber,
                ),
                const SizedBox(width: 6),
                Text(
                  _isOnline ? 'ONLINE' : 'OFFLINE',
                  style: TextStyle(
                    fontSize: 8,
                    fontWeight: FontWeight.bold,
                    color: _isOnline ? Colors.emerald : Colors.amber,
                  ),
                )
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Cloud upload ledger manager alerts
          if (_unsyncedQueueSize > 0)
            Container(
              color: Colors.blue.withOpacity(0.12),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                children: [
                  const Icon(Icons.cloud_sync, color: Colors.blueAccent, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    '$_unsyncedQueueSize transactions queue holding locally',
                    style: const TextStyle(color: Colors.blue, fontSize: 11, fontWeight: FontWeight.w600),
                  ),
                  const Spacer(),
                  TextButton.icon(
                    onPressed: _syncWithCloud,
                    icon: const Icon(Icons.upload, size: 12),
                    label: const Text('SYNC LEDGER', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.blueAccent,
                      visualDensity: VisualDensity.compact,
                    ),
                  )
                ],
              ),
            ),

          // Search Field Text entry
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              onChanged: (val) => setState(() => _searchQuery = val),
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Search SKU, Location, Name...',
                hintStyle: const TextStyle(color: Colors.white24, fontSize: 13),
                prefixIcon: const Icon(Icons.search, color: Colors.white24, size: 18),
                filled: true,
                fillColor: const Color(0xFF1E293B),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          // Main Inventory dynamic List view
          Expanded(
            child: ProductListView(
              products: filtered,
              onRefresh: _refreshLocalData,
              onProductTap: _showAdjustInventorySheet,
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Fire capture photo bottom sheet
          showModalBottomSheet(
            context: context,
            backgroundColor: const Color(0xFF1E293B),
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(24),
                topRight: Radius.circular(24),
              ),
            ),
            builder: (context) {
              return Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Capture Product Picture',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                    const SizedBox(height: 16),
                    CameraCaptureWidget(
                      onImageCaptured: (newPath) {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Product Image Snapshot linked successfully to local assets!'),
                            behavior: SnackBarBehavior.floating,
                            backgroundColor: Colors.blueAccent,
                          ),
                        );
                      },
                    ),
                  ],
                ),
              );
            },
          );
        },
        backgroundColor: Colors.blueAccent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: const Icon(Icons.add_a_photo, color: Colors.white),
      ),
    );
  }
}
