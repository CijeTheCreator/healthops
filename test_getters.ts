import {
  getAllHealthData,
  getHealthDataByUsername,
} from "./services/healthServices";
import {
  getAllHealthSignals,
  getHealthSignalsByUsername,
} from "./services/healthSignalServices";

async function testGetters() {
  const signals = await getHealthSignalsByUsername("Chijioke");
  console.log(signals);
}

testGetters();
