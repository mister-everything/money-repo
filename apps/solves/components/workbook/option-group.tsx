"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface OptionGroupProps {
  label: string;
  name?: string;
  options: string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  type?: "single" | "multiple";
  className?: string;
  required?: boolean;
}

export function OptionGroup({
  label,
  name,
  options,
  value,
  onValueChange,
  type = "single",
  className,
  required = false,
}: OptionGroupProps) {
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const handleOptionClick = (option: string) => {
    const isSelected = selectedValues.includes(option);

    if (type === "single") {
      onValueChange?.(isSelected && !required ? "" : option);
    } else {
      // multiple 타입: required면 최소 1개는 유지해야 함

      if (isSelected && required && selectedValues.length === 1) return;

      const newValues = isSelected
        ? selectedValues.filter((v) => v !== option)
        : [...selectedValues, option];
      onValueChange?.(newValues);
    }
  };

  const isSelected = (option: string) => selectedValues.includes(option);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-cols gap-1">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {required && <span className="text-red-500 text-sm">*</span>}
        {label === "인원" && (
          <p className="text-sm text-muted-foreground">
            (* 1인 문제는 풀이 후 문제집 별 개인 랭킹이 노출됩니다.)
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = isSelected(option);
          return (
            <Label
              key={option}
              htmlFor={name ? `${name}-${option}` : option}
              className={cn(
                "group/field-label peer/field-label flex w-fit items-center gap-2 cursor-pointer select-none",
                "rounded-md border px-3 py-1.5 transition-all duration-100 ease-linear",
                "hover:bg-accent/50",
                checked
                  ? "bg-primary/5 border-primary dark:bg-primary/10"
                  : "border-input bg-background",
              )}
            >
              {/* Hidden input for form submission */}
              {name && checked && (
                <input type="hidden" name={name} value={option} />
              )}
              <div className="flex items-center gap-1.5 overflow-hidden">
                <Checkbox
                  id={name ? `${name}-${option}` : option}
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
