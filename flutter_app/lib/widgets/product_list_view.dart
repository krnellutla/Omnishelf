import 'package:flutter/material.dart';
import '../models/product.dart';
import '../repositories/inventory_repository.dart';

class ProductListView extends StatelessWidget {
  final List<Product> products;
  final Future<void> Function() onRefresh;
  final Function(Product) onProductTap;

  const ProductListView({
    Key? key,
    required this.products,
    required this.onRefresh,
    required this.onProductTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (products.isEmpty) {
      return RefreshIndicator(
        onRefresh: onRefresh,
        color: const Color(0xFF2563EB),
        backgroundColor: const Color(0xFF1E293B),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(height: MediaQuery.of(context).size.height * 0.25),
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.inventory_2_outlined,
                      size: 40,
                      color: Colors.white24,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'No Active Product SKU Registered',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Pull down to refresh or sync with Firestore API',
                    style: TextStyle(
                      color: Colors.white38,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      color: const Color(0xFF2563EB),
      backgroundColor: const Color(0xFF1E293B),
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: products.length,
        itemBuilder: (context, index) {
          final product = products[index];
          final bool isLowStock = product.quantity <= product.minStock;

          return Hero(
            tag: 'product-card-${product.id}',
            child: Card(
              color: const Color(0xFF1E293B), // Slate-800
              margin: const EdgeInsets.only(bottom: 12),
              elevation: 2,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(
                  color: isLowStock 
                      ? Colors.redAccent.withOpacity(0.3) 
                      : Colors.white.withOpacity(0.05),
                  width: 1,
                ),
              ),
              child: InkWell(
                onTap: () => onProductTap(product),
                borderRadius: BorderRadius.circular(16),
                child: Padding(
                  padding: const EdgeInsets.all(14.0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Product Thumbnail image
                      Container(
                        width: 58,
                        height: 58,
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F172A), // Slate-950
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: product.imageUrl != null && product.imageUrl!.isNotEmpty
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.network(
                                  product.imageUrl!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return const Icon(
                                      Icons.broken_image_outlined,
                                      color: Colors.white24,
                                      size: 24,
                                    );
                                  },
                                ),
                              )
                            : const Icon(
                                Icons.inventory_2_outlined,
                                color: Color(0xFF3B82F6),
                                size: 24,
                              ),
                      ),
                      const SizedBox(width: 14),

                      // Product detailed info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              product.name,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                fontSize: 13.5,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 3),
                            Row(
                              children: [
                                Text(
                                  product.sku,
                                  style: const TextStyle(
                                    color: Colors.white54,
                                    fontSize: 10,
                                    fontFamily: 'monospace',
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  width: 3,
                                  height: 3,
                                  decoration: const BoxDecoration(
                                    color: Colors.white24,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  product.category,
                                  style: TextStyle(
                                    color: Colors.blue[300],
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            
                            // Badge indicating stock health status & price
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                  decoration: BoxDecoration(
                                    color: isLowStock 
                                        ? Colors.redAccent.withOpacity(0.12) 
                                        : Colors.emerald.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    isLowStock ? 'LOW STOCK ALERT' : 'STOCK HEALTHY',
                                    style: TextStyle(
                                      fontSize: 8.5,
                                      fontWeight: FontWeight.w8300,
                                      color: isLowStock ? Colors.redAccent : Colors.emerald,
                                    ),
                                  ),
                                ),
                                if (product.location.isNotEmpty) ...[
                                  const SizedBox(width: 8),
                                  Text(
                                    'LOC: ${product.location}',
                                    style: const TextStyle(
                                      fontSize: 9, 
                                      color: Colors.white38,
                                    ),
                                  ),
                                ],
                              ],
                            )
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Price and Current quantity layout
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '\$${product.price.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Colors.white70,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              Text(
                                '${product.quantity}',
                                style: TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.bold,
                                  color: isLowStock ? Colors.redAccent : Colors.white,
                                ),
                              ),
                              const SizedBox(width: 2),
                              const Text(
                                'pcs',
                                style: TextStyle(
                                  fontSize: 9,
                                  color: Colors.white24,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
