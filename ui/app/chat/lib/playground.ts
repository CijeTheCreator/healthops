export type AttachmentType =
  | "text"
  | "xml"
  | "json"
  | "markdown"
  | "code"
  | "image"
  | "audio"
  | "video"
  | "pdf"
  | "unknown";
export type MediaAttachmentType = Extract<
  AttachmentType,
  "image" | "audio" | "video" | "pdf"
>;
export type ContextAttachment = {
  id: string;
  name: string;
  type: AttachmentType;
  sizeBytes: number;
  tokenCount: number;
  content: string;
  mimeType?: string;
  createdAt: string;
  contentTruncated?: boolean;
};

export type Playground = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  familyMember: string;
  prompt: string;
  dateStart: Date;
  dateEnd: Date;
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
  playground?: Playground;
  compact?: boolean;
  outputTruncated?: boolean;
  thoughtsTruncated?: boolean;
};

export type ModelOption = string;

export type ProviderOption = {
  provider: string;
  label?: string;
  connected?: boolean;
  defaultModel?: {
    provider: string;
    model: string;
  };
  models?: string[];
};

export type CatalogPayload = {
  models: ModelOption[];
  providers: ProviderOption[];
  defaultModel?: {
    provider: string;
    model: string;
  };
  error?: string;
};

export type DisplayLanguage = "en" | "ko";

export function createId(prefix = "id") {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

export function estimateTokens(text: string) {
  const normalized = text.trim();

  if (!normalized) {
    return 0;
  }

  const charEstimate = Math.ceil(text.length / 4);
  const wordCount = normalized.split(/\s+/).length;
  const wordEstimate = Math.ceil(wordCount * 1.25);

  return Math.max(charEstimate, wordEstimate, 1);
}

const mediaAttachmentTypes = new Set<AttachmentType>([
  "image",
  "audio",
  "video",
  "pdf",
]);

export function isMediaAttachmentType(
  type: AttachmentType,
): type is MediaAttachmentType {
  return mediaAttachmentTypes.has(type);
}

export function classifyAttachmentType(
  name: string,
  content: string,
  mimeType = "",
): AttachmentType {
  const lowerName = name.toLowerCase();
  const extension = lowerName.includes(".")
    ? (lowerName.split(".").pop() ?? "")
    : "";
  const normalized = content.trimStart();

  if (
    mimeType.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "avif"].includes(
      extension,
    )
  ) {
    return "image";
  }

  if (
    mimeType.startsWith("audio/") ||
    ["mp3", "wav", "m4a", "aac", "ogg", "oga", "flac", "webm"].includes(
      extension,
    )
  ) {
    return "audio";
  }

  if (
    mimeType.startsWith("video/") ||
    ["mp4", "mov", "m4v", "avi", "mkv", "webm"].includes(extension)
  ) {
    return "video";
  }

  if (mimeType === "application/pdf" || extension === "pdf") {
    return "pdf";
  }

  if (extension === "md" || extension === "markdown") {
    return "markdown";
  }

  if (
    extension === "xml" ||
    (normalized.startsWith("<") && normalized.includes("</"))
  ) {
    return "xml";
  }

  if (extension === "json") {
    try {
      JSON.parse(content);
      return "json";
    } catch {
      return "json";
    }
  }

  if (
    extension === "txt" ||
    extension === "text" ||
    extension === "csv" ||
    extension === "log"
  ) {
    return "text";
  }

  const codeExtensions = new Set([
    "ts",
    "tsx",
    "js",
    "jsx",
    "mjs",
    "cjs",
    "py",
    "go",
    "rs",
    "java",
    "kt",
    "kts",
    "cs",
    "cpp",
    "c",
    "h",
    "hpp",
    "rb",
    "php",
    "swift",
    "dart",
    "sh",
    "bash",
    "zsh",
    "sql",
    "yml",
    "yaml",
    "toml",
    "ini",
    "env",
    "css",
    "scss",
    "html",
    "svelte",
    "vue",
  ]);

  if (codeExtensions.has(extension)) {
    return "code";
  }

  if (
    /^(import|export|function|class|const|let|var|package|from)\b/m.test(
      normalized,
    )
  ) {
    return "code";
  }

  return "unknown";
}

export function formatTime(value: string, language: DisplayLanguage = "en") {
  return new Date(value).toLocaleTimeString(localeForLanguage(language), {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateTime(
  value: string,
  language: DisplayLanguage = "en",
) {
  return new Date(value).toLocaleString(localeForLanguage(language), {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function localeForLanguage(language: DisplayLanguage) {
  return language === "ko" ? "ko-KR" : "en-US";
}
