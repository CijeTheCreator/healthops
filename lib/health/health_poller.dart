import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:health/health.dart';
import 'package:flutter/services.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'health_metric.dart';
import 'package:healthops/network_service.dart';

class HealthPoller {
  final Health _health = Health();
  Timer? _timer;
  bool _authorized = false;
  static const _channel = MethodChannel('com.healthops/health_background');

  bool _pollingEnabled = false;
  String? _allowedSsid;
  String? _name;
  String? _ip;

  /// Call this before start(). Only polls when the device is on [ssid].
  void configure({
    required String allowedSsid,
    required String name,
    required String ip,
  }) {
    _allowedSsid = allowedSsid;
    _name = name;
    _ip = ip;
  }

  void enablePolling() => _pollingEnabled = true;
  void disablePolling() => _pollingEnabled = false;

  // Range-based types (they have meaningful interval_start / interval_end)
  static const _rangeTypes = {
    HealthDataType.SLEEP_ASLEEP,
    HealthDataType.SLEEP_AWAKE,
    HealthDataType.SLEEP_AWAKE_IN_BED,
    HealthDataType.SLEEP_DEEP,
    HealthDataType.SLEEP_IN_BED,
    HealthDataType.SLEEP_LIGHT,
    HealthDataType.SLEEP_OUT_OF_BED,
    HealthDataType.SLEEP_REM,
    HealthDataType.SLEEP_UNKNOWN,
    HealthDataType.SLEEP_SESSION,
    HealthDataType.WORKOUT,
    HealthDataType.MINDFULNESS,
  };

  void _listenForBackgroundUpdates() {
    _channel.setMethodCallHandler((call) async {
      if (call.method == 'healthDataUpdated') {
        debugPrint('[HealthPoller] Woken by HealthKit — polling...');
        await poll();
      }
    });
  }

  Future<void> init() async {
    debugPrint('[HealthPoller] Configuring...');
    await _health.configure();

    await _health.requestAuthorization(
      kAllTypes,
      permissions: kAllTypes.map((_) => HealthDataAccess.READ_WRITE).toList(),
    );

    if (Platform.isAndroid) {
      _authorized = true;
    } else {
      _authorized = await _health.hasPermissions(kAllTypes) ?? false;
    }

    debugPrint('[HealthPoller] Authorized: $_authorized');

    if (_authorized && Platform.isIOS) {
      await _channel.invokeMethod('authGranted');
      _listenForBackgroundUpdates();
    }
  }

  void start() {
    if (Platform.isIOS) {
      debugPrint('[HealthPoller] iOS — waiting for HealthKit wake-ups...');
      return;
    }
    debugPrint('[HealthPoller] Starting 15s poll timer...');
    poll();
    _timer = Timer.periodic(const Duration(seconds: 15), (_) => poll());
  }

  void stop() => _timer?.cancel();

  // ---------------------------------------------------------------------------
  // Poll
  // ---------------------------------------------------------------------------

  Future<void> poll() async {
    if (!_authorized) return;
    if (!_pollingEnabled) return;

    // SSID guard
    if (Platform.isAndroid &&
        const bool.fromEnvironment('dart.vm.product') == false) {
      debugPrint('[HealthPoller] Debug mode — skipping SSID check');
    } else if (_allowedSsid != null) {
      final current = await NetworkService.currentSsid();
      if (current != _allowedSsid) {
        debugPrint('[HealthPoller] Wrong network ($current) — skipping.');
        return;
      }
    }

    final now = DateTime.now();
    final longWindow = now.subtract(const Duration(hours: 24));

    final allTypes = HealthDataType.values.where((type) {
      if (Platform.isIOS) return true; // HealthKit supports most
      if (Platform.isAndroid) {
        // Health Connect has a more limited set
        return _health.isDataTypeAvailable(type);
      }
      return false;
    }).toList();

    final pointTypes = kAllTypes
        .where((t) => !_rangeTypes.contains(t))
        .toList();
    final rangeTypesList = kAllTypes
        .where((t) => _rangeTypes.contains(t))
        .toList();

    final List<HealthDataPoint> raw = [];

    if (allTypes.isNotEmpty) {
      try {
        final allPoints = await _health.getHealthDataFromTypes(
          startTime: longWindow,
          endTime: now,
          types: allTypes,
        );
        raw.addAll(allPoints);
      } catch (e) {
        debugPrint('[HealthPoller] Error fetching point types: $e');
      }
    }

    final unique = _health.removeDuplicates(raw);

    // Build entries from the current poll
    final List<Map<String, dynamic>> freshEntries = [];
    for (final point in unique) {
      final entry = _toLogEntry(point);
      freshEntries.add(entry);
    }

    if (freshEntries.isEmpty) {
      debugPrint('[HealthPoller] No data to send (no new data).');
      return;
    }

    debugPrint('[HealthPoller] Sending ${freshEntries.length} entries ');

    await _sendToServer(freshEntries);
  }

  // ---------------------------------------------------------------------------
  // Network
  // ---------------------------------------------------------------------------

  /// Sends [payload] to the server.
  /// Returns `true` on HTTP 200/201, `false` on any error or non-success status.
  Future<bool> _sendToServer(List<Map<String, dynamic>> payload) async {
    final endpoint = 'http://$_ip:${dotenv.env['PORT'] ?? '3000'}/api/consume';
    final url = Uri.parse(endpoint);
    debugPrint('[HealthPoller] Endpoint -> $endpoint');

    try {
      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'data': payload, 'username': _name}),
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200 || response.statusCode == 201) {
        debugPrint(
          '[HealthPoller] Successfully sent ${payload.length} entries.',
        );
        return true;
      } else {
        debugPrint(
          '[HealthPoller] Server returned ${response.statusCode}: ${response.body}',
        );
        return false;
      }
    } catch (e) {
      debugPrint('[HealthPoller] Network error: $e');
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Data mapping helpers
  // ---------------------------------------------------------------------------

  Map<String, dynamic> _toLogEntry(HealthDataPoint p) {
    debugPrint(p.toJson().toString());
    return p.toJson();
  }
}
