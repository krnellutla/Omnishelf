import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'widgets/dashboard.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set gorgeous, eye-safe Dark Mode system bars
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF0F172A),
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  runApp(const LogiLedgerMobileApp());
}

class LogiLedgerMobileApp extends StatelessWidget {
  const LogiLedgerMobileApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LogiLedger Tenant Companion',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF2563EB), // Premium blue brand color
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF2563EB),
          secondary: Colors.emerald,
          background: Color(0xFF0F172A),
          surface: Color(0xFF1E293B),
        ),
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        fontFamily: 'Roboto',
      ),
      home: const TenantInventoryDashboard(
        // Defaulting to the active tenant workspace to guarantee zero multi-tenant data bleed
        activeTenantId: 'tenant-apex',
      ),
    );
  }
}
