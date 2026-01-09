import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

import { ThemeIcon } from "../ui/custom-icon";
import { GradualSpacingText } from "../ui/gradual-spacing-text";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

export function SetupTheme() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <div className="flex flex-col gap-4 justify-center items-center">
      <Label className="text-2xl font-semibold px-2 flex items-center">
        <ThemeIcon className="mr-2" />
        <GradualSpacingText text="어떤 테마를 사용하시겠어요?" />
      </Label>

      <RadioGroup
        className="flex flex-col gap-2 fade-1000"
        value={resolvedTheme}
        onValueChange={setTheme}
      >
        <Label
          className={cn(
            "flex items-center gap-2 w-xs p-4 border rounded-lg hover:bg-primary/5 hover:text-primary hover:border-primary cursor-pointer transition-all duration-300",
            resolvedTheme === "light"
              ? "bg-primary/5 text-primary border-primary"
              : "",
          )}
          htmlFor="light"
        >
          <RadioGroupItem value="light" id="light" />
          <span>밝은</span>
        </Label>

        <Label
          className={cn(
            "flex items-center gap-2 w-xs p-4 border rounded-lg hover:bg-primary/5 hover:text-primary hover:border-primary cursor-pointer transition-all duration-300",
            resolvedTheme === "dark"
              ? "bg-primary/5 text-primary border-primary"
              : "",
          )}
          htmlFor="dark"
        >
          <RadioGroupItem value="dark" id="dark" />
          <span>어두운</span>
        </Label>
      </RadioGroup>
    </div>
  );
}
