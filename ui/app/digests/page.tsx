"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { capitalizeFirstLetter, SAMPLE_REPORT } from "@/lib/utils";
import { FamilyStats, WeeklyDigest } from "../types";
import Markdown from "react-markdown";
import { ENDPOINT_URL, POLLING_INTERVAL } from "@/lib/config";

export type Report = {
  id: string;
  familyMember: string;
  date: string;
  digest: string;
};

export default function IntelligencePage() {
  const [digests, setDigests] = useState<WeeklyDigest[]>([]);
  const [selectedDigest, setSelectedDigest] = useState<WeeklyDigest | null>(
    null,
  );
  const [ip, setIp] = useState("loading...");

  useEffect(() => {
    async function fetchFamilyData() {
      try {
        const response = await fetch(`${ENDPOINT_URL}/api/stats`);
        if (!response.ok) {
          throw new Error("Request for stats failed");
        }
        const familyStats = (await response.json()) as FamilyStats;
        setIp(familyStats.ip);
        setDigests(familyStats.weeklyDigests);
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

  return (
    <div className="p-6 space-y-6 h-[100%]">
      {/* Header */}
      <div className="flex flex-col h-[100%] gap-4">
        <div className="flex flex-col sm:flex-row  items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wider">
              Weekly Digests
            </h1>
            <p className="text-sm text-neutral-400">
              Reports based on family health
            </p>
          </div>
        </div>

        {/* Intelligence Reports */}
        <Card className="bg-neutral-900 border-neutral-700 flex-1">
          <CardContent className="py-4 h-[100%]">
            {digests.length == 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="space-y-3 overflow-y-auto flex flex-col items-center justify-center text-2xl text-white h-[100%] text-center">
                  <p>Ready to get started?</p>
                  <p>
                    Simply set your IP address to{" "}
                    <span className="font-bold text-yellow-400">{ip}</span> in
                    the app settings to enable your health monitoring. A digest
                    will be created every week for each family member.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {digests.map((digest) => (
                  <div
                    key={digest.id}
                    className="border border-neutral-700 rounded p-4 hover:border-orange-500/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedDigest(digest)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-neutral-400 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="text-sm font-bold text-white tracking-wider">
                              {`${capitalizeFirstLetter(digest.username)} - ${digest.created_at}`}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Detail Modal */}
      {selectedDigest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">
                  {`${capitalizeFirstLetter(selectedDigest.username)} - ${selectedDigest.created_at}`}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedDigest(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4">
                <div className="text-white">
                  <Markdown>{selectedDigest.body}</Markdown>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
