import { MainPane } from "./MainPane";
import { RightSettingsPanel } from "./RightSettingsPanel";
import { usePlaygroundController } from "./usePlaygroundController";

export function Chat() {
  return <AppShellContent />;
}

function AppShellContent() {
  const controller = usePlaygroundController();

  return (
    <>
      <div className="flex h-screen w-full bg-brand-dark text-brand-light font-mono overflow-hidden">
        {/* <Sidebar */}
        {/*   history={controller.history} */}
        {/*   selectedRunId={controller.selectedRunId} */}
        {/*   onSelectRun={controller.selectRun} */}
        {/*   onDeleteRun={controller.deleteRun} */}
        {/*   onNewChat={controller.createNewChat} */}
        {/*   providerStatus={controller.catalogState} */}
        {/*   tokens={controller.totalTokens} */}
        {/*   tokenLimit={controller.currentModel?.limit?.context ?? 0} */}
        {/* /> */}
        <MainPane
          playground={controller.playground}
          displayedRun={controller.displayedRun}
          onTitleChange={controller.setTitle}
          onPromptChange={controller.setPrompt}
          onRun={controller.run}
        />
        <RightSettingsPanel
          playground={controller.playground}
          familyMembers={controller.familyMemberOptions}
          onFamilyMemberChange={controller.setFamilyMember}
          onDateEndChange={controller.changeEndDate}
          onDateStartChange={controller.changeStartDate}
        />
      </div>
    </>
  );
}
