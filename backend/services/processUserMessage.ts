import { GoogleGenAI } from "@google/genai";
import { getAllHealthData } from "./healthServices";
import { getAllHealthSignals } from "./healthSignalServices";
import { CHAT_BOT_PROMPT } from "../prompts/outputs";

const DEFAULT_GATEWAY_TIMEOUT_MS = 120_000;

export type Playground = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  prompt: string;
  dateStart?: string;
  dateEnd?: string;
};

export type RunResult = {
  id: string;
  playgroundId: string;
  status: "idle" | "running" | "completed" | "failed" | "cancelled";
  thoughtsText: string;
  finalText: string;
  error?: string;
  partial: boolean;
  startedAt: string;
  completedAt?: string;
  compact?: boolean;
  outputTruncated?: boolean;
  thoughtsTruncated?: boolean;
};

export type CollectStreamingPromptResponseOptions = {
  playground: Playground;
  timeoutMs?: number;
  onStart?: (data: { runId: string; sessionId?: string }) => void;
  onDelta?: (delta: PromptStreamDelta) => void;
  onError?: (message: string) => void;
};

export type CollectStreamingPromptResponseResult = RunResult & {
  sessionId?: string;
};

export type PromptStreamDelta = {
  channel: "thoughts" | "final";
  text: string;
};

export async function collectStreamingPromptResponse({
  playground,
  timeoutMs = DEFAULT_GATEWAY_TIMEOUT_MS,
  onStart,
  onDelta,
  onError,
}: CollectStreamingPromptResponseOptions): Promise<CollectStreamingPromptResponseResult> {
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  let capturedError: string | undefined;

  onStart?.({ runId });

  try {
    const ai = new GoogleGenAI({});

    const rawData =
      (await getAllHealthData({
        createdFrom: playground.dateStart,
        createdTo: playground.dateEnd,
      })) || [];

    const processedSignals =
      (await getAllHealthSignals({
        createdFrom: playground.dateStart,
        createdTo: playground.dateEnd,
      })) || [];

    const prompt = CHAT_BOT_PROMPT.replace(
      "{{NEW_USER_MESSAGE}}",
      playground.prompt,
    )
      .replace("{{PREVIOUS_CONVERSATION}}", "")
      .replace("{{PROCESSED_CONTEXT}}", JSON.stringify(processedSignals))
      .replace("{{RAW_CONTEXT}}", JSON.stringify(rawData));

    const response = await ai.models.generateContentStream({
      model: "gemma-4-26b-a4b-it",
      contents: prompt,
      config: {
        thinkingConfig: {
          includeThoughts: true,
        },
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeoutMs),
    );

    let thoughtsText = "";
    let finalText = "";

    await Promise.race([
      (async () => {
        for await (const chunk of response) {
          for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
            if (!part.text) continue;

            if (part.thought) {
              thoughtsText += part.text;
              onDelta?.({ channel: "thoughts", text: part.text });
            } else {
              finalText += part.text;
              onDelta?.({ channel: "final", text: part.text });
            }
          }
        }
      })(),
      timeoutPromise,
    ]);

    return {
      id: runId,
      playgroundId: playground.id,
      sessionId: undefined,
      status: "completed",
      thoughtsText,
      finalText,
      error: undefined,
      partial: false,
      startedAt,
      completedAt: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    capturedError = message;
    onError?.(message);

    return {
      id: runId,
      playgroundId: playground.id,
      sessionId: undefined,
      status: "failed",
      thoughtsText: "",
      finalText: "",
      error: capturedError,
      partial: false,
      startedAt,
      completedAt: new Date().toISOString(),
    };
  }
}
