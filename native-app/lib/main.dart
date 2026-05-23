import 'dart:io';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'health/health_poller.dart';
import 'network_service.dart';

// ── background service wiring ─────────────────────────────────────────────────

Future<void> initBackgroundService() async {
  final service = FlutterBackgroundService();
  await service.configure(
    androidConfiguration: AndroidConfiguration(
      onStart: onBackgroundServiceStart,
      autoStart: true,
      isForegroundMode: true,
      notificationChannelId: 'health_poller',
      initialNotificationTitle: 'HealthOps',
      initialNotificationContent: 'Polling in background…',
      foregroundServiceNotificationId: 42,
    ),
    iosConfiguration: IosConfiguration(
      autoStart: false,
      onForeground: onBackgroundServiceStart,
      onBackground: onIosBackground,
    ),
  );
  await service.startService();
}

@pragma('vm:entry-point')
Future<bool> onIosBackground(ServiceInstance service) async => true;

@pragma('vm:entry-point')
void onBackgroundServiceStart(ServiceInstance service) async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");

  final poller = HealthPoller();
  await poller.init();
  Timer? pollTimer;

  service.on('startPolling').listen((data) {
    final ssid = data?['ssid'] as String?;
    final name = data?['name'] as String?;
    final ip = data?['ip'] as String?;         // ← receive ip
    debugPrint('[BGService] startPolling received, ssid=$ssid, name=$name, ip=$ip');

    poller.configure(allowedSsid: ssid!, name: name!, ip: ip!);  // ← pass ip
    poller.enablePolling();

    pollTimer?.cancel();
    pollTimer = Timer.periodic(const Duration(seconds: 15), (_) async {
      await poller.poll();
      service.invoke('healthUpdate', {
        'timestamp': DateTime.now().toIso8601String(),
        'name': name,
        'ip': ip,                              // ← forward ip in updates
      });
    });

    poller.poll();
  });

  service.on('stopPolling').listen((_) {
    debugPrint('[BGService] stopPolling received');
    poller.disablePolling();
    pollTimer?.cancel();
    pollTimer = null;
  });

  service.on('stop').listen((_) {
    pollTimer?.cancel();
    service.stopSelf();
  });
}

// ── app entry point ───────────────────────────────────────────────────────────

late final HealthPoller _mainPoller;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");

  if (Platform.isAndroid) {
    await initBackgroundService();
  } else if (Platform.isIOS) {
    _mainPoller = HealthPoller();
    await _mainPoller.init();
  }

  runApp(const MyApp());
}

// ── UI ────────────────────────────────────────────────────────────────────────

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: ThemeData.dark(useMaterial3: true),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final List<String> _savedNetworks = [];

  String? _selectedSsid;
  bool _isPolling = false;
  bool _loadingCurrentSsid = true;

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _ipController = TextEditingController();  // ← new
  final TextEditingController _addController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _detectCurrentNetwork();
    _nameController.addListener(() => setState(() {}));
    _ipController.addListener(() => setState(() {}));                   // ← new
  }

  @override
  void dispose() {
    _nameController.dispose();
    _ipController.dispose();                                            // ← new
    _addController.dispose();
    super.dispose();
  }

  Future<void> _detectCurrentNetwork() async {
    final ssid = await NetworkService.currentSsid();
    setState(() {
      _loadingCurrentSsid = false;
      if (ssid != null && ssid.isNotEmpty) {
        final clean = ssid.replaceAll('"', '');
        if (!_savedNetworks.contains(clean)) _savedNetworks.add(clean);
        _selectedSsid = clean;
      }
    });
  }

  // ── polling control ───────────────────────────────────────────────────────

  Future<void> _startPolling() async {
    final name = _nameController.text.trim();
    final ip = _ipController.text.trim();                               // ← new
    if (_selectedSsid == null || name.isEmpty || ip.isEmpty) return;   // ← guard

    debugPrint('[HealthPoller] SSID: $_selectedSsid, name: $name, ip: $ip');

    if (Platform.isAndroid) {
      final service = FlutterBackgroundService();
      service.invoke('startPolling', {
        'ssid': _selectedSsid,
        'name': name,
        'ip': ip,                                                       // ← pass ip
      });
    } else {
      _mainPoller.configure(allowedSsid: _selectedSsid!, name: name, ip: ip); // ← pass ip
      _mainPoller.enablePolling();
      _mainPoller.start();
    }
    setState(() => _isPolling = true);
  }

  void _stopPolling() {
    if (Platform.isAndroid) {
      FlutterBackgroundService().invoke('stopPolling');
    } else {
      _mainPoller.disablePolling();
    }
    setState(() => _isPolling = false);
  }

  // ── add network dialog ────────────────────────────────────────────────────

  void _showAddNetworkDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add network'),
        content: TextField(
          controller: _addController,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Network name (SSID)'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              final name = _addController.text.trim();
              if (name.isNotEmpty && !_savedNetworks.contains(name)) {
                setState(() {
                  _savedNetworks.add(name);
                  _selectedSsid = name;
                });
              }
              _addController.clear();
              Navigator.pop(ctx);
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  // ── build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    // Button is active only when name, ip, and SSID are all provided
    final bool canStart =                                               // ← updated
        _selectedSsid != null &&
        _nameController.text.trim().isNotEmpty &&
        _ipController.text.trim().isNotEmpty;

    return Scaffold(
      appBar: AppBar(title: const Center(child: Text('HealthOps'))),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── header ────────────────────────────────────────────────────
            Icon(Icons.wifi, size: 56, color: cs.primary),
            const SizedBox(height: 12),
            Text(
              'Home Network',
              textAlign: TextAlign.center,
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: 6),
            Text(
              'Polling only runs while connected to the selected network.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: cs.onSurfaceVariant,
              ),
            ),

            const SizedBox(height: 40),

            // ── name field ────────────────────────────────────────────────
            Text('Your name', style: theme.textTheme.labelLarge),
            const SizedBox(height: 8),
            TextField(
              controller: _nameController,
              enabled: !_isPolling,
              decoration: InputDecoration(
                hintText: 'Enter your name',
                prefixIcon: const Icon(Icons.person_outline),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),

            const SizedBox(height: 24),

            // ── ip address field ──────────────────────────────────────────  ← new
            Text('IP address', style: theme.textTheme.labelLarge),
            const SizedBox(height: 8),
            TextField(
              controller: _ipController,
              enabled: !_isPolling,
              keyboardType: TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                hintText: '192.168.1.100',
                prefixIcon: const Icon(Icons.lan_outlined),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),

            const SizedBox(height: 24),

            // ── dropdown ──────────────────────────────────────────────────
            _loadingCurrentSsid
                ? const Center(child: CircularProgressIndicator())
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('Select network', style: theme.textTheme.labelLarge),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        value: _selectedSsid,
                        decoration: InputDecoration(
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          prefixIcon: const Icon(Icons.router),
                        ),
                        hint: const Text('Choose a network…'),
                        items: [
                          ..._savedNetworks.map(
                            (ssid) => DropdownMenuItem(
                              value: ssid,
                              child: Text(ssid),
                            ),
                          ),
                          const DropdownMenuItem(
                            value: '__add__',
                            child: Row(
                              children: [
                                Icon(Icons.add, size: 18),
                                SizedBox(width: 8),
                                Text('Add network…'),
                              ],
                            ),
                          ),
                        ],
                        onChanged: _isPolling
                            ? null
                            : (val) {
                                if (val == '__add__') {
                                  _showAddNetworkDialog();
                                } else {
                                  setState(() => _selectedSsid = val);
                                }
                              },
                      ),
                    ],
                  ),

            const SizedBox(height: 32),

            // ── start / stop button ───────────────────────────────────────
            FilledButton.icon(
              onPressed: _isPolling
                  ? _stopPolling
                  : (canStart ? _startPolling : null),
              icon: Icon(_isPolling ? Icons.stop : Icons.play_arrow),
              label: Text(_isPolling ? 'Stop Polling' : 'Start Polling'),
              style: FilledButton.styleFrom(
                backgroundColor: _isPolling ? cs.error : cs.primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
                textStyle: theme.textTheme.titleMedium,
              ),
            ),

            const SizedBox(height: 20),

            // ── status chip ───────────────────────────────────────────────
            Center(
              child: Chip(
                avatar: Icon(
                  _isPolling ? Icons.circle : Icons.circle_outlined,
                  size: 14,
                  color: _isPolling ? Colors.greenAccent : cs.onSurfaceVariant,
                ),
                label: Text(
                  _isPolling
                      ? 'Polling on "$_selectedSsid" as ${_nameController.text.trim()} (${_ipController.text.trim()})' // ← show ip
                      : 'Idle',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
