import 'package:network_info_plus/network_info_plus.dart';

class NetworkService {
  static final _info = NetworkInfo();

  /// Returns the SSID the device is currently connected to, or null.
  static Future<String?> currentSsid() async {
    try {
      return await _info.getWifiName(); // returns '"MyNetwork"' (with quotes on iOS)
    } catch (_) {
      return null;
    }
  }
}
