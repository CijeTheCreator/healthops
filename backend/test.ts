import z from "zod";
import { getLastHealthData } from "./services/healthServices";
import { SIGNAL_PROMPT } from "./prompts/outputs";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { configDotenv } from "dotenv";
import { samples } from "./samples";
import {
  genAi_processNewMessage,
  processNewMessage,
} from "./services/llmServices";
configDotenv({ quiet: true });

const SignalOutput = z.object({
  signal: z
    .enum(["normal", "watch", "alert"])
    .describe("Severity level based on deviation from recent patterns"),
  observation: z
    .string()
    .describe(
      "1–2 sentence, data-grounded insight about the current entry only. Reference actual values or trends; avoid vague language.",
    ),
});

export async function testGemma({}: {}) {
  try {
    const llm = new ChatGoogleGenerativeAI({
      model: "gemma-4-26b-a4b-it",
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const windowSize = 30;
    const lastEntries = await getLastHealthData(windowSize);

    const prompt = SIGNAL_PROMPT.replace(
      "{{WINDOW_SIZE}}",
      windowSize.toString(),
    )
      .replace("{{CURRENT_ENTRY}}", JSON.stringify(samples.normal))
      .replace("{{CONTEXT_WINDOW}}", JSON.stringify(lastEntries));

    const signalOutput = await llm
      .withStructuredOutput(SignalOutput)
      .invoke([{ role: "user", content: prompt }]);

    console.log(signalOutput);
  } catch (error) {
    console.log((error as Error).message);
  }
}

// testGemma({});

async function testChatbot() {
  const response = await genAi_processNewMessage({
    newUserMessage:
      "How many calories have I been burning on average this week?",
    previousConversation: "",
    rangeStart: "2025-01-13",
    rangeEnd: new Date(Date.now()).toISOString().split("T")[0],
  });
  console.log(response);
}
testChatbot();
