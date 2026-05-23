import { Paperclip, Send } from "lucide-react";

type PromptComposerProps = {
  prompt: string;
  isRunning: boolean;
  onPromptChange: (value: string) => void;
  onRun: () => void;
};

export function PromptComposer({
  prompt,
  isRunning,
  onPromptChange,
  onRun,
}: PromptComposerProps) {
  return (
    <div className="flex flex-col gap-2 relative bg-[#1a1818] p-6 border-t border-[#646262]">
      <div className="relative rounded-[4px] border border-[#646262] bg-[#302c2c] focus-within:border-brand-accent transition-colors overflow-hidden group">
        <textarea
          className="w-full h-[120px] max-h-[300px] resize-y p-5 text-[16px] text-brand-light placeholder:text-[#9a9898] bg-transparent outline-none focus:outline-none focus:ring-0 leading-[1.5]"
          placeholder={
            "Ask the model to analyze, summarize, review, or rewrite the attached context..."
          }
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          onPaste={(event) => {
            const files = filesFromClipboard(event.clipboardData);
            const pastedText = event.clipboardData.getData("text/plain");
            const shouldAttachText = false;

            if (files.length === 0 && !shouldAttachText) {
              return;
            }

            event.preventDefault();
          }}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              onRun();
            }
          }}
        />

        <div className="absolute bottom-3 right-3 flex items-center gap-3">
          <span className="text-[10px] opacity-60 uppercase text-brand-mid">
            {"Ctrl/Command + Enter to run"}
          </span>
          <button
            type="button"
            onClick={onRun}
            disabled={isRunning}
            className="bg-brand-accent text-brand-light font-bold px-5 py-1.5 rounded-[4px] text-[13px] hover:bg-brand-accent-hover transition-colors outline-none flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            {isRunning ? "Running" : "Run"}
          </button>
        </div>
      </div>
    </div>
  );
}

function filesFromClipboard(data: DataTransfer) {
  return Array.from(data.items)
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file))
    .filter(isSupportedClipboardFile)
    .map((file, index) => {
      const extension = extensionForMime(file.type);
      const kind = kindForMime(file.type);
      const fallbackName = `pasted-${kind}-${new Date().toISOString().replace(/[:.]/g, "-")}-${index + 1}.${extension}`;
      return new File([file], file.name || fallbackName, {
        type: file.type,
      });
    });
}

function textFileFromPaste(text: string) {
  return new File(
    [text],
    `pasted-context-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`,
    {
      type: "text/plain",
    },
  );
}

function extensionForMime(mimeType: string) {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "application/pdf") {
    return "pdf";
  }

  const subtype = mimeType.split("/")[1]?.replace("+xml", "") || "png";
  return subtype === "svg" ? "svg" : subtype;
}

function isSupportedClipboardFile(file: File) {
  return (
    file.type.startsWith("image/") ||
    file.type.startsWith("audio/") ||
    file.type.startsWith("video/") ||
    file.type === "application/pdf"
  );
}

function kindForMime(mimeType: string) {
  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (mimeType === "application/pdf") {
    return "pdf";
  }

  return "image";
}
