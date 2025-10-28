"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  const handleValueChange = (newValue: string[]) => {
    if (type === "single") {
      // Single 타입: 마지막 선택된 값만 유지
      onValueChange?.(newValue[newValue.length - 1] || "");
    } else {
      // Multiple 타입: 배열 전체 전달
      onValueChange?.(newValue);
    }
  };
  return (
    <div className={cn("space-y-3", className)}>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <ToggleGroup
        type="multiple"
        value={Array.isArray(value) ? value : value ? [value] : []}
        onValueChange={handleValueChange}
        className="flex-wrap justify-start"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option}
            value={option}
            className="rounded-lg px-4 py-2"
          >
            {option}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
