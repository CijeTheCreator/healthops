import { GoogleGenAI } from "@google/genai";
import { configDotenv } from "dotenv";
import { getAllHealthData } from "./services/healthServices";
import { getAllHealthSignals } from "./services/healthSignalServices";
import { CHAT_BOT_PROMPT, WEEKLY_DIGEST_PROMPT } from "./prompts/outputs";
configDotenv({ quiet: true });

const rangeStart = "2025-01-13";
const rangeEnd = new Date(Date.now()).toISOString().split("T")[0];

export async function generateMessageResponse({
  rangeStart,
  rangeEnd,
}: {
  rangeStart: string;
  rangeEnd: string;
}) {
  const ai = new GoogleGenAI({});
  let thoughts = "";
  let answer = "";

  const processedSignals =
    (await getAllHealthData({
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
}

generateMessageResponse({ rangeStart, rangeEnd });
