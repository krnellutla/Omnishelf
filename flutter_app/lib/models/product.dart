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
