import { ConversationView } from "../features/ConversationView";
import { PromptComposer } from "../features/PromptComposer";
import { Playground, RunResult } from "../../lib/playground";
import { useRunElapsedLabel } from "../../lib/runTiming";

type MainPaneProps = {
  playground: Playground;
  displayedRun: RunResult | null;
  onTitleChange: (value: string) => void;
  onPromptChange: (value: string) => void;
  onRun: () => void;
};

export function MainPane({
  playground,
  displayedRun,
  onTitleChange,
  onPromptChange,
  onRun,
}: MainPaneProps) {
  return (
    <main className="flex-1 flex flex-col h-full bg-[#201d1d] relative">
      <div
        className="flex-1 overflow-y-auto w-full px-6 py-6 pb-24 relative outline-none flex flex-col gap-6"
        tabIndex={-1}
      >
        <ConversationView
          playground={playground}
          displayedRun={displayedRun}
          onRun={onRun}
        />
      </div>

      <PromptComposer
        prompt={playground.prompt}
        isRunning={displayedRun?.status === "running"}
        onPromptChange={onPromptChange}
        onRun={onRun}
      />
    </main>
  );
}

function PlaygroundHeader({
  playground,
  displayedRun,
  onTitleChange,
}: Pick<MainPaneProps, "playground" | "displayedRun" | "onTitleChange">) {
  const status = displayedRun?.status ?? "idle";
  const elapsedLabel = useRunElapsedLabel(displayedRun);
  const statusLabel =
    status === "running"
      ? "Running"
      : status === "failed"
        ? "Error"
        : status === "completed"
          ? "Ready"
          : "Idle";
  return (
    <header className="h-14 border-b border-[#646262] flex items-center justify-between gap-6 px-6 flex-shrink-0">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <input
          value={playground.title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="text-[16px] font-bold underline decoration-[#646262] bg-transparent outline-none min-w-0 w-[360px] max-w-[52vw]"
        />
      </div>
    </header>
  );
}
