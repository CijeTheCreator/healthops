import 'dart:io';
import 'package:health/health.dart';

enum HealthDomain {
  sleep,
  heart,
  activity,
  nutrition,
  body,
  reproductive,
  mindfulness,
  symptom,
}

enum HealthMetric {
  // Heart
  heartRate,
  restingHr,
  walkingHr,
  hrvSdnn,
  hrvRmssd,
  bloodOxygen,
  bpSystolic,
  bpDiastolic,
  afibBurden,
  highHrEvent,
  lowHrEvent,
  irregularHrEvent,
  ecg,
  // Sleep
  sleepAsleepMinutes,
  sleepAwakeMinutes,
  sleepDeepMinutes,
  sleepLightMinutes,
  sleepRemMinutes,
  sleepInBedMinutes,
  sleepAwakeInBedMinutes,
  sleepOutOfBedMinutes,
  sleepUnknownMinutes,
  sleepSession,
  // Activity
  steps,
  activeEnergyBurned,
  basalEnergyBurned,
  distanceWalkingRunning,
  distanceDelta,
  flightsClimbed,
  exerciseTime,
  workout,
  // Nutrition
  nutrition,
  water,
  bloodGlucose,
  insulinDelivery,
  // Body
  weight,
  height,
  bmi,
  bodyFatPercentage,
  bodyTemperature,
  waistCircumference,
  leanBodyMass,
  bodyWaterMass,
  electrodermalActivity,
  // Reproductive
  menstruationFlow,
  // Mindfulness
  mindfulness,
  // Symptom
  headacheNotPresent,
  headacheMild,
  headacheModerate,
  headacheSevere,
  headacheUnspecified,
  // Misc
  uvIndex,
  walkingSpeed,
  appleStandHour,
  appleMoveTime,
}

// Maps HealthDataType → (domain, metric, unit)
class MetricMeta {
  final HealthDomain domain;
  final HealthMetric metric;
  final String unit;
  const MetricMeta(this.domain, this.metric, this.unit);
}

const Map<HealthDataType, MetricMeta> kMetricMap = {
  // Heart
  HealthDataType.HEART_RATE: MetricMeta(
    HealthDomain.heart,
    HealthMetric.heartRate,
    'bpm',
  ),
  HealthDataType.TOTAL_CALORIES_BURNED: MetricMeta(
    HealthDomain.activity,
    HealthMetric.activeEnergyBurned, // or a new dedicated metric
    'kcal',
  ),
  HealthDataType.RESTING_HEART_RATE: MetricMeta(
    HealthDomain.heart,
    HealthMetric.restingHr,
    'bpm',
  ),
  HealthDataType.WALKING_HEART_RATE: MetricMeta(
    HealthDomain.heart,
    HealthMetric.walkingHr,
    'bpm',
  ),
  HealthDataType.HEART_RATE_VARIABILITY_SDNN: MetricMeta(
    HealthDomain.heart,
    HealthMetric.hrvSdnn,
    'ms',
  ),
  HealthDataType.HEART_RATE_VARIABILITY_RMSSD: MetricMeta(
    HealthDomain.heart,
    HealthMetric.hrvRmssd,
    'ms',
  ),
  HealthDataType.BLOOD_OXYGEN: MetricMeta(
    HealthDomain.heart,
    HealthMetric.bloodOxygen,
    '%',
  ),
  HealthDataType.BLOOD_PRESSURE_SYSTOLIC: MetricMeta(
    HealthDomain.heart,
    HealthMetric.bpSystolic,
    'mmHg',
  ),
  HealthDataType.BLOOD_PRESSURE_DIASTOLIC: MetricMeta(
    HealthDomain.heart,
    HealthMetric.bpDiastolic,
    'mmHg',
  ),
  HealthDataType.ATRIAL_FIBRILLATION_BURDEN: MetricMeta(
    HealthDomain.heart,
    HealthMetric.afibBurden,
    '%',
  ),
  HealthDataType.HIGH_HEART_RATE_EVENT: MetricMeta(
    HealthDomain.heart,
    HealthMetric.highHrEvent,
    'event',
  ),
  HealthDataType.LOW_HEART_RATE_EVENT: MetricMeta(
    HealthDomain.heart,
    HealthMetric.lowHrEvent,
    'event',
  ),
  HealthDataType.IRREGULAR_HEART_RATE_EVENT: MetricMeta(
    HealthDomain.heart,
    HealthMetric.irregularHrEvent,
    'event',
  ),
  HealthDataType.ELECTROCARDIOGRAM: MetricMeta(
    HealthDomain.heart,
    HealthMetric.ecg,
    'V',
  ),
  // Sleep
  HealthDataType.SLEEP_ASLEEP: MetricMeta(
    HealthDomain.sleep,
    HealthMetric.sleepAsleepMinutes,
    'min',
  ),
  HealthDataType.SLEEP_AWAKE: MetricMeta(
    HealthDomain.sleep,
    HealthMetric.sleepAwakeMinutes,
    'min',
  ),
  HealthDataType.SLEEP_DEEP: MetricMeta(
    HealthDomain.sleep,
    HealthMetric.sleepDeepMinutes,
    'min',
  ),
  HealthDataType.SLEEP_LIGHT: MetricMeta(
    HealthDomain.sleep,
    HealthMetric.sleepLightMinutes,
    'min',
  ),
  HealthDataType.SLEEP_REM: MetricMeta(
    HealthDomain.sleep,
    HealthMetric.sleepRemMinutes,
    'min',
  ),
  HealthDataType.SLEEP_IN_BED: MetricMeta(
    HealthDomain.sleep,
    HealthMetric.sleepInBedMinutes,
    'min',
  ),
  HealthDataType.SLEEP_AWAKE_IN_BED: MetricMeta(
    HealthDomain.sleep,
    HealthMetric.sleepAwakeInBedMinutes,
    'min',
  ),
  HealthDataType.SLEEP_OUT_OF_BED: MetricMeta(
    HealthDomain.sleep,
    HealthMetric.sleepOutOfBedMinutes,
    'min',
  ),
  HealthDataType.SLEEP_UNKNOWN: MetricMeta(
    HealthDomain.sleep,
    HealthMetric.sleepUnknownMinutes,
    'min',
  ),
  HealthDataType.SLEEP_SESSION: MetricMeta(
    HealthDomain.sleep,
    HealthMetric.sleepSession,
    'min',
  ),
  // Activity
  HealthDataType.STEPS: MetricMeta(
    HealthDomain.activity,
    HealthMetric.steps,
    'count',
  ),
  HealthDataType.ACTIVE_ENERGY_BURNED: MetricMeta(
    HealthDomain.activity,
    HealthMetric.activeEnergyBurned,
    'kcal',
  ),
  HealthDataType.BASAL_ENERGY_BURNED: MetricMeta(
    HealthDomain.activity,
    HealthMetric.basalEnergyBurned,
    'kcal',
  ),
  HealthDataType.DISTANCE_WALKING_RUNNING: MetricMeta(
    HealthDomain.activity,
    HealthMetric.distanceWalkingRunning,
    'm',
  ),
  HealthDataType.DISTANCE_DELTA: MetricMeta(
    HealthDomain.activity,
    HealthMetric.distanceDelta,
    'm',
  ),
  HealthDataType.FLIGHTS_CLIMBED: MetricMeta(
    HealthDomain.activity,
    HealthMetric.flightsClimbed,
    'count',
  ),
  HealthDataType.EXERCISE_TIME: MetricMeta(
    HealthDomain.activity,
    HealthMetric.exerciseTime,
    'min',
  ),
  HealthDataType.WORKOUT: MetricMeta(
    HealthDomain.activity,
    HealthMetric.workout,
    '',
  ),
  // Nutrition
  HealthDataType.NUTRITION: MetricMeta(
    HealthDomain.nutrition,
    HealthMetric.nutrition,
    '',
  ),
  HealthDataType.WATER: MetricMeta(
    HealthDomain.nutrition,
    HealthMetric.water,
    'L',
  ),
  HealthDataType.BLOOD_GLUCOSE: MetricMeta(
    HealthDomain.nutrition,
    HealthMetric.bloodGlucose,
    'mg/dL',
  ),
  HealthDataType.INSULIN_DELIVERY: MetricMeta(
    HealthDomain.nutrition,
    HealthMetric.insulinDelivery,
    'IU',
  ),
  // Body
  HealthDataType.WEIGHT: MetricMeta(
    HealthDomain.body,
    HealthMetric.weight,
    'kg',
  ),
  HealthDataType.HEIGHT: MetricMeta(
    HealthDomain.body,
    HealthMetric.height,
    'm',
  ),
  HealthDataType.BODY_MASS_INDEX: MetricMeta(
    HealthDomain.body,
    HealthMetric.bmi,
    '',
  ),
  HealthDataType.BODY_FAT_PERCENTAGE: MetricMeta(
    HealthDomain.body,
    HealthMetric.bodyFatPercentage,
    '%',
  ),
  HealthDataType.BODY_TEMPERATURE: MetricMeta(
    HealthDomain.body,
    HealthMetric.bodyTemperature,
    '°C',
  ),
  HealthDataType.WAIST_CIRCUMFERENCE: MetricMeta(
    HealthDomain.body,
    HealthMetric.waistCircumference,
    'm',
  ),
  HealthDataType.LEAN_BODY_MASS: MetricMeta(
    HealthDomain.body,
    HealthMetric.leanBodyMass,
    'kg',
  ),
  HealthDataType.BODY_WATER_MASS: MetricMeta(
    HealthDomain.body,
    HealthMetric.bodyWaterMass,
    'kg',
  ),
  HealthDataType.ELECTRODERMAL_ACTIVITY: MetricMeta(
    HealthDomain.body,
    HealthMetric.electrodermalActivity,
    'S',
  ),
  // Reproductive
  HealthDataType.MENSTRUATION_FLOW: MetricMeta(
    HealthDomain.reproductive,
    HealthMetric.menstruationFlow,
    '',
  ),
  // Mindfulness
  HealthDataType.MINDFULNESS: MetricMeta(
    HealthDomain.mindfulness,
    HealthMetric.mindfulness,
    'min',
  ),
  // Symptom
  HealthDataType.HEADACHE_NOT_PRESENT: MetricMeta(
    HealthDomain.symptom,
    HealthMetric.headacheNotPresent,
    'min',
  ),
  HealthDataType.HEADACHE_MILD: MetricMeta(
    HealthDomain.symptom,
    HealthMetric.headacheMild,
    'min',
  ),
  HealthDataType.HEADACHE_MODERATE: MetricMeta(
    HealthDomain.symptom,
    HealthMetric.headacheModerate,
    'min',
  ),
  HealthDataType.HEADACHE_SEVERE: MetricMeta(
    HealthDomain.symptom,
    HealthMetric.headacheSevere,
    'min',
  ),
  HealthDataType.HEADACHE_UNSPECIFIED: MetricMeta(
    HealthDomain.symptom,
    HealthMetric.headacheUnspecified,
    'min',
  ),
};

// Types that only exist on iOS — requesting these on Android causes auth to fail
const Set<HealthDataType> _iosOnly = {
  HealthDataType.ATRIAL_FIBRILLATION_BURDEN,
  HealthDataType.ELECTRODERMAL_ACTIVITY,
  HealthDataType.WALKING_HEART_RATE,
  HealthDataType.HEART_RATE_VARIABILITY_SDNN,
  HealthDataType.HIGH_HEART_RATE_EVENT,
  HealthDataType.LOW_HEART_RATE_EVENT,
  HealthDataType.IRREGULAR_HEART_RATE_EVENT,
  HealthDataType.ELECTROCARDIOGRAM,
  HealthDataType.HEADACHE_NOT_PRESENT,
  HealthDataType.HEADACHE_MILD,
  HealthDataType.HEADACHE_MODERATE,
  HealthDataType.HEADACHE_SEVERE,
  HealthDataType.HEADACHE_UNSPECIFIED,
  HealthDataType.MINDFULNESS,
  HealthDataType.EXERCISE_TIME,
  HealthDataType.DISTANCE_WALKING_RUNNING,
  HealthDataType.SLEEP_IN_BED,
  HealthDataType.WAIST_CIRCUMFERENCE,
  HealthDataType.INSULIN_DELIVERY,
};

// Types that only exist on Android — requesting these on iOS causes auth to fail
const Set<HealthDataType> _androidOnly = {
  HealthDataType.BODY_WATER_MASS,
  HealthDataType.DISTANCE_DELTA,
  HealthDataType.HEART_RATE_VARIABILITY_RMSSD,
  HealthDataType.SLEEP_AWAKE_IN_BED,
  HealthDataType.SLEEP_OUT_OF_BED,
  HealthDataType.SLEEP_UNKNOWN,
  HealthDataType.SLEEP_SESSION,
};

/// Platform-filtered list of types safe to pass to requestAuthorization()
List<HealthDataType> get kAllTypes {
  return kMetricMap.keys.where((type) {
    if (Platform.isAndroid) return !_iosOnly.contains(type);
    if (Platform.isIOS) return !_androidOnly.contains(type);
    return true;
  }).toList();
}
