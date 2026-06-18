import 'dart:async';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('logiledger_tenant.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
      onConfigure: _onConfigure,
    );
  }

  Future _onConfigure(Database db) async {
    await db.execute('PRAGMA foreign_keys = ON');
  }

  Future _createDB(Database db, int version) async {
    const textType = 'TEXT NOT NULL';
    const textNullable = 'TEXT';
    const integerType = 'INTEGER NOT NULL';
    const realType = 'REAL NOT NULL';

    // 1. Categories Table (Tenant Isolated)
    await db.execute('''
      CREATE TABLE categories (
        id $textType PRIMARY KEY,
        name $textType,
        color $textType,
        tenantId $textType,
        updatedAt $textType
      )
    ''');

    // 2. Products Table (Indexed SKU and Barcode for fast queries)
    await db.execute('''
      CREATE TABLE products (
        id $textType PRIMARY KEY,
        name $textType,
        barcode $textType,
        sku $textType,
        category $textType,
        price $realType,
        cost $realType,
        quantity $integerType,
        minStock $integerType,
        supplier $textType,
        location $textType,
        updatedAt $textType,
        createdBy $textType,
        tenantId $textType,
        imageUrl $textNullable
      )
    ''');

    await db.execute('CREATE INDEX idx_products_sku ON products (sku)');
    await db.execute('CREATE INDEX idx_products_barcode ON products (barcode)');
    await db.execute('CREATE INDEX idx_products_tenant ON products (tenantId)');

    // 3. Transactions Local Ledger Queue (Tracking pending synchronizations)
    await db.execute('''
      CREATE TABLE transactions_ledger (
        id $textType PRIMARY KEY,
        productId $textType,
        productName $textType,
        type $textType,
        quantityChanged $integerType,
        newQuantity $integerType,
        reason $textType,
        timestamp $textType,
        tenantId $textType,
        userId $textType,
        isSynced INTEGER NOT NULL DEFAULT 0
      )
    ''');
    
    await db.execute('CREATE INDEX idx_ledger_sync ON transactions_ledger (isSynced)');
  }

  Future<void> close() async {
    final db = await instance.database;
    db.close();
  }
}
