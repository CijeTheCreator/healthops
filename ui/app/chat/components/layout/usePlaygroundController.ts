import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Playground, RunResult, createId } from "../../lib/playground";
import { runPlayground as runPlaygroundRequest } from "../../lib/playgroundApi";
import { FamilyStats } from "../../../types";
import { ENDPOINT_URL, POLLING_INTERVAL } from "../../../../lib/config";

const now = () => new Date().toISOString();

const CLIENT_FINAL_TEXT_LIMIT = 120_000;
const CLIENT_THOUGHTS_TEXT_LIMIT = 60_000;
const CLIENT_HISTORY_ATTACHMENT_LIMIT = 120_000;
const CLIENT_TRIM_NOTICE = "\n\n[Trimmed to reduce memory use.]";

function normalizePlayground(playground: Playground): Playground {
  return {
    ...playground,
  };
}

function normalizeRunForClient(run: RunResult): RunResult {
  const rawFinalText = run.finalText ?? "";
  const rawThoughtsText = run.thoughtsText ?? "";
  const finalText = stripEchoedPrompt(
    limitText(rawFinalText, CLIENT_FINAL_TEXT_LIMIT),
  );
  const thoughtsText = limitText(rawThoughtsText, CLIENT_THOUGHTS_TEXT_LIMIT);
  const outputTruncated =
    run.outputTruncated || finalText.length < rawFinalText.length;
  const thoughtsTruncated =
    run.thoughtsTruncated || thoughtsText.length < rawThoughtsText.length;

  return {
    ...run,
    finalText,
    thoughtsText,
    partial: run.partial || outputTruncated || thoughtsTruncated,
    outputTruncated,
    thoughtsTruncated,
    playground: run.playground
      ? normalizePlaygroundForHistory(run.playground)
      : run.playground,
  };
}

function normalizePlaygroundForHistory(playground: Playground): Playground {
  return normalizePlayground({
    ...playground,
    prompt: limitText(playground.prompt, CLIENT_HISTORY_ATTACHMENT_LIMIT),
  });
}

function limitText(value: string | undefined, maxLength: number) {
  const text = value ?? "";
  if (text.length <= maxLength) {
    return text;
  }

  const suffix = CLIENT_TRIM_NOTICE;
  const retainedLength = Math.max(0, maxLength - suffix.length);
  return `${text.slice(0, retainedLength)}${suffix}`;
}

function stripEchoedPrompt(value: string) {
  const trimmedStart = value.trimStart();
  if (
    !trimmedStart.startsWith("<attached_context>") &&
    !trimmedStart.startsWith("<user_task>")
  ) {
    return value;
  }

  const userTaskEnd = value.indexOf("</user_task>");
  if (userTaskEnd === -1) {
    return "";
  }

  return value.slice(userTaskEnd + "</user_task>".length).trimStart();
}

function appendWithLimit(current: string, delta: string, maxLength: number) {
  if (current.length >= maxLength) {
    return { text: current, truncated: true };
  }

  const next = `${current}${delta}`;
  if (next.length <= maxLength) {
    return { text: next, truncated: false };
  }

  return {
    text: limitText(next, maxLength),
    truncated: true,
  };
}

function createEmptyPlayground(): Playground {
  const createdAt = now();
  const today = new Date();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  return {
    id: createId("playground"),
    title: "Titled Playground",
    createdAt,
    updatedAt: createdAt,
    familyMember: "",
    prompt: "",
    dateStart: sevenDaysAgo,
    dateEnd: today,
  };
}

export function usePlaygroundController() {
  const [playground, setPlayground] = useState<Playground>(
    createEmptyPlayground,
  );
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);

  useEffect(() => {
    async function fetchFamilyData() {
      try {
        const response = await fetch(`${ENDPOINT_URL}/api/stats`);
        if (!response.ok) {
          throw new Error("Request for stats failed");
        }
        const familyStats = (await response.json()) as FamilyStats;
        setFamilyMembers(familyStats.members);
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

  const [history, setHistory] = useState<RunResult[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [currentRun, setCurrentRun] = useState<RunResult | null>(null);

  const runControllerRef = useRef<AbortController | null>(null);
  const selectedRunIdRef = useRef(selectedRunId);
  const playgroundRef = useRef(playground);

  useEffect(() => {
    playgroundRef.current = playground;
  }, [playground]);

  useEffect(() => {
    selectedRunIdRef.current = selectedRunId;
  }, [selectedRunId]);

  const displayedRun = currentRun ?? null;

  const familyMemberOptions = useMemo(() => {
    return familyMembers;
  }, []);

  const currentFamilyMember = useMemo(() => {
    return familyMemberOptions.find(
      (item: string) => item === playground.familyMember,
    );
  }, [familyMemberOptions, playground.familyMember]);

  const updatePlayground = useCallback(
    (updater: (previous: Playground) => Playground) => {
      setPlayground((previous) => ({
        ...updater(previous),
        updatedAt: now(),
      }));
    },
    [],
  );

  const changeStartDate = useCallback(
    (value: Date) => {
      updatePlayground((previous) => ({ ...previous, dateStart: value }));
    },
    [updatePlayground],
  );

  const changeEndDate = useCallback(
    (value: Date) => {
      updatePlayground((previous) => ({ ...previous, dateEnd: value }));
    },
    [updatePlayground],
  );

  const setPrompt = useCallback(
    (value: string) => {
      const previousValue = playgroundRef.current.prompt;
      if (value !== previousValue) {
        setCurrentRun((run) => (run?.status === "running" ? run : null));
        setSelectedRunId("");
      }
      updatePlayground((previous) => ({ ...previous, prompt: value }));
    },
    [updatePlayground],
  );

  const setTitle = useCallback(
    (value: string) => {
      updatePlayground((previous) => ({ ...previous, title: value }));
    },
    [updatePlayground],
  );

  const setFamilyMember = useCallback(
    (familyMember: string) => {
      updatePlayground((previous) => ({
        ...previous,
        familyMember,
      }));
    },
    [updatePlayground],
  );

  const createNewChat = useCallback(() => {
    runControllerRef.current?.abort();
    const createdAt = now();

    setPlayground((previous) => ({
      ...previous,
      id: createId("playground"),
      title: "Untitled Playground",
      createdAt,
      updatedAt: createdAt,
      prompt: "",
    }));
    setCurrentRun(null);
    setSelectedRunId("");
  }, []);

  const finalizeRun = useCallback(
    (result: RunResult, replaceId = result.id) => {
      setCurrentRun(result); // was: setCurrentRun(null)
      setSelectedRunId(result.id);
    },
    [],
  );

  const showTransientRun = useCallback((result: RunResult) => {
    const normalized = normalizeRunForClient(result);
    setCurrentRun(normalized);
    setSelectedRunId(normalized.id);
  }, []);

  const run = useCallback(async () => {
    if (currentRun?.status === "running") {
      return;
    }

    if (!playgroundRef.current.prompt.trim()) {
      const failedRun: RunResult = {
        id: createId("run"),
        playgroundId: playgroundRef.current.id,
        status: "failed",
        thoughtsText: "",
        finalText: "",
        error: "Add a prompt or attach context before running.",
        partial: false,
        startedAt: now(),
        completedAt: now(),
      };
      showTransientRun(failedRun);
      return;
    }

    runControllerRef.current?.abort();
    const controller = new AbortController();
    runControllerRef.current = controller;

    const startedAt = now();
    const tempId = createId("run");

    const pending: RunResult = {
      id: tempId,
      playgroundId: playgroundRef.current.id,
      status: "running",
      thoughtsText: "",
      finalText: "",
      partial: false,
      startedAt,
    };

    setCurrentRun(pending);
    setSelectedRunId(tempId);

    let hasStreamedContent = false;
    const streamState = {
      thoughtsText: "",
      finalText: "",
      thoughtsTruncated: false,
      finalTruncated: false,
    };

    try {
      let finalized = false;
      let streamError = "";

      await runPlaygroundRequest(
        {
          ...playgroundRef.current,
          updatedAt: startedAt,
        },
        (event) => {
          if (finalized) {
            return;
          }

          if (event.type === "start") {
            return;
          }

          if (event.type === "delta") {
            if (event.data.channel === "thoughts") {
              const next = appendWithLimit(
                streamState.thoughtsText,
                event.data.text,
                CLIENT_THOUGHTS_TEXT_LIMIT,
              );
              streamState.thoughtsText = next.text;
              streamState.thoughtsTruncated =
                streamState.thoughtsTruncated || next.truncated;
            } else {
              const next = appendWithLimit(
                streamState.finalText,
                event.data.text,
                CLIENT_FINAL_TEXT_LIMIT,
              );
              streamState.finalText = next.text;
              streamState.finalTruncated =
                streamState.finalTruncated || next.truncated;
            }

            hasStreamedContent = true;
            const nextValue: RunResult = {
              ...pending,
              thoughtsText: streamState.thoughtsText,
              finalText: streamState.finalText,
              partial:
                streamState.thoughtsTruncated || streamState.finalTruncated,
              thoughtsTruncated: streamState.thoughtsTruncated,
              outputTruncated: streamState.finalTruncated,
            };
            setCurrentRun(nextValue);
            return;
          }

          if (event.type === "error") {
            const message =
              normalizeGatewayError(event.data) ?? "Unknown gateway error";
            streamError = message;
            const finalText = extractProviderErrorMessage(streamState.finalText)
              ? ""
              : streamState.finalText;
            const failedRun: RunResult = {
              ...pending,
              status: "failed",
              thoughtsText: streamState.thoughtsText,
              finalText,
              error: message,
              partial: Boolean(
                finalText ||
                streamState.thoughtsText ||
                streamState.thoughtsTruncated ||
                streamState.finalTruncated,
              ),
              thoughtsTruncated: streamState.thoughtsTruncated,
              outputTruncated: streamState.finalTruncated,
              completedAt: now(),
            };
            setCurrentRun(failedRun);
            return;
          }

          if (event.type === "done") {
            const doneRun = normalizeRunForClient({
              ...event.data,
              thoughtsText: event.data.thoughtsText || streamState.thoughtsText,
              finalText: event.data.finalText,
              partial:
                streamState.thoughtsTruncated ||
                streamState.finalTruncated ||
                (event.data.status === "completed" && !event.data.error
                  ? false
                  : event.data.partial),
              thoughtsTruncated:
                streamState.thoughtsTruncated || event.data.thoughtsTruncated,
              outputTruncated:
                streamState.finalTruncated || event.data.outputTruncated,
            });
            finalized = true;
            finalizeRun(doneRun, tempId);
          }
        },
        controller.signal,
      );

      if (!finalized && !controller.signal.aborted) {
        const status = streamError ? "failed" : "completed";
        const result: RunResult = {
          ...pending,
          status,
          thoughtsText: streamState.thoughtsText,
          finalText: streamState.finalText,
          error: streamError || undefined,
          partial: Boolean(
            (streamError && hasStreamedContent) ||
            streamState.thoughtsTruncated ||
            streamState.finalTruncated,
          ),
          thoughtsTruncated: streamState.thoughtsTruncated,
          outputTruncated: streamState.finalTruncated,
          completedAt: now(),
        };

        if (streamError) {
          showTransientRun(result);
        } else {
          finalizeRun(result, tempId);
        }
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      const failedRun: RunResult = {
        ...pending,
        status: "failed",
        thoughtsText: streamState.thoughtsText,
        finalText: streamState.finalText,
        partial:
          hasStreamedContent ||
          streamState.thoughtsTruncated ||
          streamState.finalTruncated,
        thoughtsTruncated: streamState.thoughtsTruncated,
        outputTruncated: streamState.finalTruncated,
        error: normalizeGatewayError(error),
        completedAt: now(),
      };
      showTransientRun(failedRun);
      console.log("Catch hit error");
      console.log(error);
      console.log(failedRun);
    } finally {
      if (runControllerRef.current === controller) {
        runControllerRef.current = null;
      }
    }
  }, [currentRun?.status, finalizeRun, familyMemberOptions, showTransientRun]);

  const selectRun = useCallback(
    (runId: string) => {
      setSelectedRunId(runId);
      setCurrentRun(null);

      const selected = history.find((item) => item.id === runId);
      if (selected?.playground) {
        setPlayground(normalizePlayground(selected.playground));
      }
    },
    [history],
  );

  return {
    playground,
    setPrompt,
    setTitle,
    setFamilyMember,
    createNewChat,
    history,
    selectedRunId,
    selectRun,
    currentRun,
    displayedRun,
    run,
    familyMemberOptions: familyMembers,
    currentFamilyMember,
    changeStartDate,
    changeEndDate,
  };
}

function extractErrorMessage(error: unknown) {
  if (!error) {
    return null;
  }

  if (typeof error === "string") {
    return extractProviderErrorMessage(error) ?? error;
  }

  if (typeof error === "object") {
    if (
      "error" in error &&
      typeof (error as { error?: unknown }).error === "string"
    ) {
      const message = (error as { error?: string }).error ?? null;
      return message ? (extractProviderErrorMessage(message) ?? message) : null;
    }

    if (
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      const message = (error as { message?: string }).message ?? null;
      return message ? (extractProviderErrorMessage(message) ?? message) : null;
    }
  }

  return null;
}

function parseJsonObject(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return undefined;
  }
}

function extractProviderErrorMessage(value: string) {
  const parsed = parseJsonObject(value);
  if (!parsed || typeof parsed !== "object") {
    return undefined;
  }

  const record = parsed as Record<string, unknown>;
  const nested =
    record.error && typeof record.error === "object"
      ? (record.error as Record<string, unknown>)
      : undefined;
  const message =
    typeof nested?.message === "string"
      ? nested.message
      : typeof record.message === "string"
        ? record.message
        : undefined;

  if (!message) {
    return undefined;
  }

  const code =
    typeof nested?.code === "string"
      ? nested.code
      : typeof record.code === "string"
        ? record.code
        : undefined;
  const type =
    typeof nested?.type === "string"
      ? nested.type
      : typeof record.type === "string"
        ? record.type
        : undefined;

  if (code === "server_error" || type === "server_error") {
    return `OpenAI server error: ${message}`;
  }

  return code || type ? `${code ?? type}: ${message}` : message;
}

function normalizeGatewayError(error: unknown) {
  const message = extractErrorMessage(error);

  if (!message) {
    return "Unable to run the playground.";
  }

  if (
    /prompt or attachment is required|prompt is required|run request failed with 400/i.test(
      message,
    )
  ) {
    return "Add a prompt or attach context before running.";
  }

  return message;
}
