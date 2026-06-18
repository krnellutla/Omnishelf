import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';
import '../helpers/database_helper.dart';
import '../models/product.dart';

class InventoryRepository {
  final _dbHelper = DatabaseHelper.instance;
  final _uuid = const Uuid();

  // Atomically process check-out or check-in within an SQLite Transaction
  Future<void> processAdjustInventory({
    required Product product,
    required int adjustmentQty,
    required String type, // 'IN' or 'OUT'
    required String reason,
    required String userId,
  }) async {
    final db = await _dbHelper.database;

    await db.transaction((txn) async {
      // Calculate New Stock
      final int originalQty = product.quantity;
      final int newQty = type == 'IN' ? originalQty + adjustmentQty : originalQty - adjustmentQty;
      final validatedNewQty = newQty < 0 ? 0 : newQty;

      // Update Product record
      await txn.update(
        'products',
        {
          'quantity': validatedNewQty,
          'updatedAt': DateTime.now().toUtc().toIso8601String(),
        },
        where: 'id = ? AND tenantId = ?',
        whereArgs: [product.id, product.tenantId],
      );

      // Register transaction into un-synced ledger queue
      await txn.insert('transactions_ledger', {
        'id': _uuid.v4(),
        'productId': product.id,
        'productName': product.name,
        'type': type,
        'quantityChanged': adjustmentQty.abs(),
        'newQuantity': validatedNewQty,
        'reason': reason,
        'timestamp': DateTime.now().toUtc().toIso8601String(),
        'tenantId': product.tenantId,
        'userId': userId,
        'isSynced': 0, // Flag for background sync
      });
    });
  }

  // Get list of pending transactions waiting to sync with Cloud Firestore
  Future<List<Map<String, dynamic>>> getUnsyncedAssets() async {
    final db = await _dbHelper.database;
    return await db.query(
      'transactions_ledger',
      where: 'isSynced = ?',
      whereArgs: [0],
      orderBy: 'timestamp ASC',
    );
  }

  // Flag transaction ledger logs once successfully integrated with Cloud Firestore
  Future<void> markAsSynced(String transactionId) async {
    final db = await _dbHelper.database;
    await db.update(
      'transactions_ledger',
      {'isSynced': 1},
      where: 'id = ?',
      whereArgs: [transactionId],
    );
  }

  // Retrieve products mapped under specified Tenant boundary
  Future<List<Product>> getProductsForTenant(String tenantId) async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'products',
      where: 'tenantId = ?',
      whereArgs: [tenantId],
      orderBy: 'name ASC',
    );
    return maps.map((item) => Product.fromMap(item)).toList();
  }

  // Add dummy demo fallback products to local DB to prevent empty states
  Future<void> seedDemoProducts(String tenantId) async {
    final db = await _dbHelper.database;
    final countResult = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM products WHERE tenantId = ?', [tenantId])
    );
    
    if (countResult == 0) {
      final demoItems = [
        Product(
          id: 'prod-demo-1',
          name: 'Super High-Speed Catalyst Engine',
          barcode: '9780201379624',
          sku: 'ENG-CAT-900',
          category: 'Machinery',
          price: 2499.00,
          cost: 1800.00,
          quantity: 4,
          minStock: 5,
          supplier: 'Apex Heavy Industries',
          location: 'Aisle B-4',
          updatedAt: DateTime.now().toUtc().toIso8601String(),
          createdBy: 'system',
          tenantId: tenantId,
          imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300',
        ),
        Product(
          id: 'prod-demo-2',
          name: 'Pneumatic Copper Coupling Valve',
          barcode: '712345678904',
          sku: 'VLV-PNE-404',
          category: 'Hardware',
          price: 45.50,
          cost: 22.00,
          quantity: 125,
          minStock: 25,
          supplier: 'Allied Fittings Corp',
          location: 'Bin F-12',
          updatedAt: DateTime.now().toUtc().toIso8601String(),
          createdBy: 'system',
          tenantId: tenantId,
          imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300',
        ),
      ];

      for (var item in demoItems) {
        await db.insert('products', item.toMap());
      }
    }
  }
}
