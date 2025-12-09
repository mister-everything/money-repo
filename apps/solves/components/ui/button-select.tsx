import { toAny } from "@workspace/util";
import { ComponentProps, ReactNode, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

type ValueHandler =
  | {
      multiple?: false;
      value?: string;
      onChange?: (value: string) => void;
    }
  | {
      multiple: true;
      value?: string[];
      onChange?: (value: string[]) => void;
    };

type ButtonSelectProps = {
  options: {
    label: ReactNode;
    value: string;
  }[];
  disabled?: boolean;
  name?: string;
} & ValueHandler &
  ComponentProps<"div">;

export function ButtonSelect({
  options,
  value,
  name,
  disabled = false,
  onChange,
  multiple = false,
  className,
  ...props
}: ButtonSelectProps) {
  const isSelected = useCallback(
    (optionValue: string) => {
      if (multiple) {
        return value?.includes(optionValue);
      }
      return value === optionValue;
    },
    [multiple, value],
  );

  const handleClick = useCallback(
    (optionValue: string) => {
      if (multiple) {
        const previousValue = value as string[];
        toAny(onChange)?.(
          previousValue?.includes(optionValue)
            ? previousValue.filter((v) => v !== optionValue)
            : [...(previousValue || []), optionValue],
        );
      } else {
        const previousValue = value as string;
        toAny(onChange)?.(previousValue === optionValue ? "" : optionValue);
      }
    },
    [multiple, value, onChange],
  );

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2",
        disabled && "opacity-70",
        className,
      )}
      {...props}
    >
      {options.map((option) => {
        const checked = isSelected(option.value);
        const key = option.value;
        return (
          <Label
            key={key}
            htmlFor={key}
            className={cn(
              "group/field-label peer/field-label flex w-fit items-center gap-2 cursor-pointer select-none",
              "rounded-md border px-3 py-1.5 transition-all duration-100 ease-linear",
              "hover:bg-accent/50",
              checked
                ? "bg-primary/5 border-primary dark:bg-primary/10"
                : "border-input bg-background",
            )}
          >
            {name && checked && (
              <input type="hidden" name={name} value={option.value} />
            )}
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Checkbox
                id={key}
                disabled={disabled}
                checked={checked}
                onCheckedChange={() => handleClick(option.value)}
                className={cn(
                  "rounded-full shadow-xs transition-all duration-100 ease-linear",
                  "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                  checked ? "ml-0 translate-x-0" : "-ml-5 -translate-x-1",
                )}
              />
              <span className="text-sm font-medium leading-snug">
                {option.label}
              </span>
            </div>
          </Label>
        );
      })}
    </div>
  );
}
