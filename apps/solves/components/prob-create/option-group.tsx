"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface OptionGroupProps {
  label: string;
  options: string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  type?: "single" | "multiple";
  className?: string;
}

export function OptionGroup({
  label,
  options,
  value,
  onValueChange,
  type = "single",
  className,
}: OptionGroupProps) {
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const handleOptionClick = (option: string) => {
    if (type === "single") {
      onValueChange?.(option);
    } else {
      const newValues = selectedValues.includes(option)
        ? selectedValues.filter((v) => v !== option)
        : [...selectedValues, option];
      onValueChange?.(newValues);
    }
  };

  const isSelected = (option: string) => selectedValues.includes(option);

  return (
    <div className={cn("space-y-3", className)}>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = isSelected(option);
          return (
            <Label
              key={option}
              htmlFor={option}
              className={cn(
                "group/field-label peer/field-label flex w-fit items-center gap-2 cursor-pointer select-none",
                "rounded-md border px-3 py-1.5 transition-all duration-100 ease-linear",
                "hover:bg-accent/50",
                checked
                  ? "bg-primary/5 border-primary dark:bg-primary/10"
                  : "border-input bg-background",
              )}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                <Checkbox
                  id={option}
                  checked={checked}
                  onCheckedChange={() => handleOptionClick(option)}
                  className={cn(
                    "rounded-full shadow-xs transition-all duration-100 ease-linear",
                    "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                    checked ? "ml-0 translate-x-0" : "-ml-5 -translate-x-1",
                  )}
                />
                <span className="text-sm font-medium leading-snug">
                  {option}
                </span>
              </div>
            </Label>
          );
        })}
      </div>
    </div>
  );
}
