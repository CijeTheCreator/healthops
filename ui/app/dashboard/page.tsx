"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  AlertTriangle,
  Database,
  Signal,
  Users,
  Receipt,
  HeartPulse,
  File,
} from ".pnpm/lucide-react@0.454.0_react@19.2.6/node_modules/lucide-react/dist/lucide-react";
import { FamilyStats, HealthSignal } from "../types";
import {
  useEffect,
  useState,
} from ".pnpm/@types+react@19.2.15/node_modules/@types/react";
import { capitalizeFirstLetter } from "../../lib/utils";
import { ENDPOINT_URL, POLLING_INTERVAL } from "../../lib/config";

export type Signal = "normal" | "watch" | "alert";
export type SignalLog = {
  time: string;
  familyMember: string;
  signal: Signal;
  observation: string;
};
export default function DashboardPage() {
  const [activeFamilyMembersCount, setActiveFamilyMembersCount] = useState(0);
  const [healthEntriesCount, setHealthEntriesCount] = useState(0);
  const [healthSignalsCount, setHealthSignalsCount] = useState(0);
  const [weeklyDigestsCount, setWeeklyDigestsCount] = useState(0);
  const [signalLogs, setSignalLogs] = useState<HealthSignal[]>([]);

  const [ip, setIp] = useState("loading...");

  useEffect(() => {
    async function fetchFamilyData() {
      try {
        const response = await fetch(`${ENDPOINT_URL}/api/stats`);
        if (!response.ok) {
          throw new Error("Request for stats failed");
        }
        const familyStats = (await response.json()) as FamilyStats;
        setActiveFamilyMembersCount(familyStats.totalMembers);
        setHealthEntriesCount(familyStats.totalHealthEntries);
        setWeeklyDigestsCount(familyStats.totalWeeklyDigests);
        setHealthSignalsCount(familyStats.totalHealthSignals);
        setSignalLogs(familyStats.healthSignals);
        if (familyStats.ip) {
          setIp(familyStats.ip);
        }
        console.log("[Poller] Fetched family data");
      } catch (error) {
        console.log("[Poller] Failed fetch");
        console.log((error as Error).message);
      }
    }
    fetchFamilyData();

    const poller = setInterval(() => {
      fetchFamilyData();
    }, parseInt(POLLING_INTERVAL.toString()));

    return () => clearInterval(poller);
  }, []);

  const getSignalColor = (signal: Signal) => {
    switch (signal) {
      case "normal":
        return "border-green-500";
      case "watch":
        return "border-orange-500";
      case "alert":
        return "border-red-500";
      default:
        return "bg-white";
    }
  };
  // const signalLogs: HealthSignal[] = [
  //   {
  //     timestamp: new Date(Date.now()).toISOString(),
  //     created_at: new Date(Date.now()).toISOString(),
  //     username: "Chijioke",
  //     signal: "normal",
  //     observation: "Vitals are great, could work on the BPM",
  //     id: 0,
  //   },
  //   {
  //     timestamp: new Date(Date.now()).toISOString().split("T")[0],
  //     created_at: new Date(Date.now()).toISOString().split("T")[0],
  //     username: "Mmesoma",
  //     signal: "watch",
  //     observation: "Unusually high step count for this time of the day",
  //     id: 1,
  //   },
  //   {
  //     timestamp: new Date(Date.now()).toISOString().split("T")[0],
  //     created_at: new Date(Date.now()).toISOString().split("T")[0],
  //     username: "Mmesoma",
  //     signal: "alert",
  //     observation: "Higher BPM than usual, you could do something about that",
  //     id: 3,
  //   },
  // ];
  return (
    <div className="p-6 space-y-6 h-[100%]">
      {/* Main Dashboard Grid */}
      <div className="flex flex-col gap-4 h-[100%]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wider">
              OVERVIEW
            </h1>
            <p className="text-sm text-neutral-400">
              An overview of the health log from different family members
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">
                    Active Family Members
                  </p>
                  <p className="text-2xl font-bold text-white font-mono">
                    {activeFamilyMembersCount}
                  </p>
                </div>
                <Users className="w-8 h-8 text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">
                    Health Entries Received
                  </p>
                  <p className="text-2xl font-bold text-white font-mono">
                    {healthEntriesCount}
                  </p>
                </div>
                <Database className="w-8 h-8 text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">
                    Health Signals
                  </p>
                  <p className="text-2xl font-bold text-white font-mono">
                    {healthSignalsCount}
                  </p>
                </div>
                <HeartPulse className="w-8 h-8 text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">
                    Weekly Digests
                  </p>
                  <p className="text-2xl font-bold text-white font-mono">
                    {weeklyDigestsCount}
                  </p>
                </div>
                <File className="w-8 h-8 text-white" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700 flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              SIGNAL LOG
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[100%]">
            {signalLogs.length == 0 ? (
              <div className="space-y-3 overflow-y-auto flex flex-col items-center justify-center text-2xl text-white h-[100%] text-center">
                <p>Ready to get started?</p>
                <p>
                  Simply set your IP address to{" "}
                  <span className="font-bold text-yellow-400">{ip}</span> in the
                  app settings to enable your health monitoring and start
                  viewing logs.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {signalLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`text-xs border-l-2 ${getSignalColor(log.signal)} pl-3 hover:bg-neutral-800 p-2 rounded transition-colors`}
                  >
                    <div className="text-neutral-500 font-mono">{`${capitalizeFirstLetter(log.username)} - ${log.timestamp}`}</div>
                    <div className="text-white">{log.observation}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
