import { GoogleGenAI, Type } from "@google/genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  CHAT_BOT_PROMPT,
  NewMessageOutput,
  SIGNAL_PROMPT,
  SignalOutput,
  WEEKLY_DIGEST_PROMPT,
} from "../prompts/outputs";
import { getAllHealthData } from "./healthServices";
import {
  getAllHealthSignals,
  getHealthSignalsByUsername,
} from "./healthSignalServices";
import { saveWeeklyDigest } from "./weeklyDigestService";

export async function generate_health_signal({
  currentEntry,
  contextWindow,
  windowSize,
}: {
  currentEntry: object;
  contextWindow: object;
  windowSize?: number;
}) {
  try {
    const selectedWindowSize = parseInt(
      windowSize?.toString() || process.env.DEFAULT_WINDOW_SIZE || "30",
    );
    const llm = new ChatGoogleGenerativeAI({
      model: "gemma-4-26b-a4b-it",
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const prompt = SIGNAL_PROMPT.replace(
      "{{WINDOW_SIZE}}",
      selectedWindowSize.toString(),
    )
      .replace("{{CURRENT_ENTRY}}", JSON.stringify(currentEntry))
      .replace("{{CONTEXT_WINDOW}}", JSON.stringify(contextWindow));

    const signalOutput = await llm
      .withStructuredOutput(SignalOutput)
      .invoke([{ role: "user", content: prompt }]);

    signalOutput["timestamp"] = new Date();

    return signalOutput;
  } catch (error) {
    console.log((error as Error).message);
  }
}

/* Expects date in this format: 2025-01-01 */
export async function processNewMessage({
  newUserMessage,
  previousConversation,
  rangeStart,
  rangeEnd,
}: {
  newUserMessage: string;
  previousConversation: string;
  rangeStart?: string;
  rangeEnd?: string;
}) {
  const rawData =
    (await getAllHealthData({
      createdFrom: rangeStart,
      createdTo: rangeEnd,
    })) || [];

  const processedSignals =
    (await getAllHealthSignals({
      createdFrom: rangeStart,
      createdTo: rangeEnd,
    })) || [];

  const llm = new ChatGoogleGenerativeAI({
    model: "gemma-4-26b-a4b-it",
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const prompt = CHAT_BOT_PROMPT.replace("{{NEW_USER_MESSAGE}}", newUserMessage)
    .replace("{{PREVIOUS_CONVERSATION}}", previousConversation)
    .replace("{{PROCESSED_CONTEXT}}", JSON.stringify(processedSignals))
    .replace("{{RAW_CONTEXT}}", JSON.stringify(rawData));

  console.log(prompt);

  const messageOutput = await llm
    .withStructuredOutput(NewMessageOutput)
    .invoke([{ role: "user", content: prompt }]);

  return messageOutput;
}

export async function genAI_ProcessMessage({
  newUserMessage,
  previousConversation,
  rangeStart,
  rangeEnd,
}: {
  newUserMessage: string;
  previousConversation: string;
  rangeStart: string;
  rangeEnd: string;
}) {
  const ai = new GoogleGenAI({});
  let thoughts = "";
  let answer = "";

  const rawData =
    (await getAllHealthData({
      createdFrom: rangeStart,
      createdTo: rangeEnd,
    })) || [];

  const processedSignals =
    (await getAllHealthSignals({
      createdFrom: rangeStart,
      createdTo: rangeEnd,
    })) || [];

  const prompt = CHAT_BOT_PROMPT.replace("{{NEW_USER_MESSAGE}}", newUserMessage)
    .replace("{{PREVIOUS_CONVERSATION}}", previousConversation)
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

  for await (const chunk of response) {
    for (const part of chunk.candidates[0].content.parts) {
      if (!part.text) {
        continue;
      } else if (part.thought) {
        if (!thoughts) {
          console.log("Thoughts summary:");
        }
        console.log(part.text);
        thoughts = thoughts + part.text;
      } else {
        if (!answer) {
          console.log("Answer:");
        }
        console.log(part.text);
        answer = answer + part.text;
      }
    }
  }
}

export async function genAI_WeeklyDigest({
  rangeStart,
  rangeEnd,
  familyMember,
}: {
  familyMember?: string;
  rangeStart?: string;
  rangeEnd?: string;
}) {
  const ai = new GoogleGenAI({});
  let thoughts = "";
  let answer = "";

  if (!familyMember) throw new Error("Family Member required");

  const processedSignals =
    (await getHealthSignalsByUsername(familyMember, {
      createdFrom: rangeStart,
      createdTo: rangeEnd,
    })) || [];

  const prompt = WEEKLY_DIGEST_PROMPT.replace(
    "{{PROCESSED_CONTEXT}}",
    JSON.stringify(processedSignals),
  ).replace("{{DATE}}", new Date(Date.now()).toISOString());

  const response = await ai.models.generateContentStream({
    model: "gemma-4-26b-a4b-it",
    contents: prompt,
    config: {
      thinkingConfig: {
        includeThoughts: true,
      },
    },
  });

  for await (const chunk of response) {
    for (const part of chunk.candidates[0].content.parts) {
      if (!part.text) {
        continue;
      } else if (part.thought) {
        if (!thoughts) {
          console.log("Thoughts summary:");
        }
        console.log(part.text);
        thoughts = thoughts + part.text;
      } else {
        if (!answer) {
          console.log("Answer:");
        }
        console.log(part.text);
        answer = answer + part.text;
      }
    }
  }

  await saveWeeklyDigest(familyMember.toLowerCase(), answer);
}

async function genAI_generateSignal({
  currentEntry,
  contextWindow,
  windowSize,
}: {
  currentEntry: object;
  contextWindow: object;
  windowSize?: number;
}) {
  try {
    const client = new GoogleGenAI({});
    const selectedWindowSize = parseInt(
      windowSize?.toString() || process.env.DEFAULT_WINDOW_SIZE || "30",
    );

    const prompt = SIGNAL_PROMPT.replace(
      "{{WINDOW_SIZE}}",
      selectedWindowSize.toString(),
    )
      .replace("{{CURRENT_ENTRY}}", JSON.stringify(currentEntry))
      .replace("{{CONTEXT_WINDOW}}", JSON.stringify(contextWindow));

    const stream = await client.interactions.create({
      model: "gemma-4-26b-a4b-it",
      input: prompt,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: SignalOutput,
      },
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === "step.delta" && event.delta?.text) {
        process.stdout.write(event.delta.text);
      }
    }

    return {
      signal: "watch",
      observation: "an observation",
      timeStamp: new Date(Date.now()),
    };
  } catch (e) {}
}
