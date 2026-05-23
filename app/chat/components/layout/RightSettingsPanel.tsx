import { CalendarIcon } from "lucide-react";
import { SettingsDropdown } from "../ui/SettingsDropdown";
import { Playground } from "../../lib/playground";
import { Button } from "../ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import { Calendar } from "../ui/Calendar";
import { Label } from "../ui/Label";
import { Input } from "../ui/Input";

type RightSettingsPanelProps = {
  playground: Playground;
  familyMembers: string[];
  onFamilyMemberChange: (familyMember: string) => void;
  onDateStartChange: (dateStart: Date | undefined) => void;
  onDateEndChange: (dateEnd: Date | undefined) => void;
};

function formatDateToInput(date?: Date): string {
  if (!date) return "";
  return date.toISOString().split("T")[0];
}

function parseDateFromInput(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

export function RightSettingsPanel({
  playground,
  familyMembers,
  onFamilyMemberChange,
  onDateStartChange,
  onDateEndChange,
}: RightSettingsPanelProps) {
  const startDateText = formatDateToInput(playground.dateStart);
  const endDateText = formatDateToInput(playground.dateEnd);

  function handleStartDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    onDateStartChange(parseDateFromInput(e.target.value));
  }

  function handleEndDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    onDateEndChange(parseDateFromInput(e.target.value));
  }

  const familyMemberDropdownOptions = familyMembers.map((item) => ({
    label: item,
    value: item,
  }));

  const currentFamilyMember = familyMembers.find(
    (item) => item === playground.familyMember,
  );

  return (
    <div className="w-[300px] flex-shrink-0 border-l border-[#646262] bg-[#1a1818] h-full overflow-y-auto flex flex-col">
      <div className="flex-1 p-4 flex flex-col gap-8">
        <section className="flex flex-col gap-4">
          <SettingsDropdown
            label={"Family Member"}
            value={currentFamilyMember}
            options={familyMemberDropdownOptions}
            onChange={onFamilyMemberChange}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="text-[11px] font-bold text-[#9a9898] uppercase tracking-widest">
            {"Range"}
          </h3>

          {/* Start Date */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="start-date" className="text-[12px] text-[#9a9898]">
              Start Date
            </Label>
            <div className="flex gap-2">
              <Input
                id="start-date"
                type="date"
                value={startDateText}
                onChange={handleStartDateChange}
                className="flex-1 bg-[#302c2c] border-[#646262] text-brand-light text-[13px]"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-[#646262] bg-[#302c2c] hover:bg-[#3d3939]"
                  >
                    <CalendarIcon className="h-4 w-4 text-[#9a9898]" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    className="bg-[#1a1818]"
                    mode="single"
                    selected={playground.dateStart}
                    onSelect={(day) => onDateStartChange(day)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="end-date" className="text-[12px] text-[#9a9898]">
              End Date
            </Label>
            <div className="flex gap-2">
              <Input
                id="end-date"
                type="date"
                value={endDateText}
                onChange={handleEndDateChange}
                className="flex-1 bg-[#302c2c] border-[#646262] text-brand-light text-[13px]"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-[#646262] bg-[#302c2c] hover:bg-[#3d3939]"
                  >
                    <CalendarIcon className="h-4 w-4 text-[#9a9898]" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    className="bg-[#1a1818]"
                    mode="single"
                    selected={playground.dateEnd}
                    onSelect={(day) => onDateEndChange(day)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
