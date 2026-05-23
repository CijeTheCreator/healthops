import UIKit
import Flutter
import HealthKit

@main
@objc class AppDelegate: FlutterAppDelegate {
  let healthStore = HKHealthStore()
  private var channel: FlutterMethodChannel?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)

    // Wire up the method channel to Flutter
    let controller = window?.rootViewController as! FlutterViewController
    channel = FlutterMethodChannel(
      name: "com.yourapp/health_background",
      binaryMessenger: controller.binaryMessenger
    )

    // Register background delivery once the health plugin
    // has already been granted permissions (call after init())
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(registerBackgroundDelivery),
      name: NSNotification.Name("HealthAuthGranted"),
      object: nil
    )

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  @objc func registerBackgroundDelivery() {
    // Mirror the types your kAllTypes covers — add/remove as needed
    let types: Set<HKSampleType> = [
      HKQuantityType.quantityType(forIdentifier: .heartRate)!,
      HKQuantityType.quantityType(forIdentifier: .stepCount)!,
      HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!,
      HKQuantityType.quantityType(forIdentifier: .restingHeartRate)!,
      HKCategoryType.categoryType(forIdentifier: .sleepAnalysis)!,
      HKObjectType.workoutType(),
    ]

    for type in types {
      // .immediate = wake app as soon as HealthKit gets new samples
      healthStore.enableBackgroundDelivery(for: type, frequency: .immediate) { success, error in
        if let error = error {
          print("[BGDelivery] Failed for \(type): \(error)")
        }
      }

      let query = HKObserverQuery(sampleType: type, predicate: nil) { [weak self] _, completionHandler, error in
        guard error == nil else {
          completionHandler() // must always call this
          return
        }
        // Notify Flutter to run _poll()
        DispatchQueue.main.async {
          self?.channel?.invokeMethod("healthDataUpdated", arguments: nil)
        }
        completionHandler() // CRITICAL — HealthKit stops delivering if omitted
      }

      healthStore.execute(query)
    }
  }
}
