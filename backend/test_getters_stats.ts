import { getFamilyStats } from "./services/dashboardService";

async function main() {
  const familyStats = await getFamilyStats();
  console.log(familyStats);
}

main();
