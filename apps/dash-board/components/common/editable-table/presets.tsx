import { format as formatDate } from "date-fns";
import React from "react";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BaseItem, ColumnDefinition } from "./types";

// Preset 파라미터 타입
type PresetParams<T = any> = Partial<ColumnDefinition<any>> & T;

// 공통 유효성 검증 함수
const validateValue = (value: any, schema?: z.ZodType<any>) => {
  if (!schema) return { isValid: true, error: null };

  try {
    schema.parse(value);
    return { isValid: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError && error.issues.length > 0) {
      return { isValid: false, error: error.issues[0].message };
    }
    return { isValid: false, error: "유효하지 않은 값입니다" };
  }
};

/**
 * 컬럼 disabled 여부를 일관되게 판단하는 헬퍼
 */
const isDisabledField = <T extends BaseItem>(
  disabled: boolean | ((item: T) => boolean) | undefined,
  item: T
): boolean => (typeof disabled === "function" ? disabled(item) : !!disabled);

// 프리셋 컬럼 정의들
export const ColumnPresets = {
  // 기본 텍스트 컬럼
  Text: <T extends BaseItem>(
    params: PresetParams<{
      key: keyof T;
      label: string;
      className?: string;
      placeholder?: string;
      transform?: (value: any) => string;
      disabled?: boolean | ((item: any) => boolean);
      type?: "text" | "number" | "email" | "password";
      schema?: z.ZodType<any>;
    }>
  ): ColumnDefinition<T> => ({
    editable: true,
    ...params,
    render: (value, item, isEditing, context) => {
      const isDisabled = isDisabledField(params.disabled, item);

      if (isEditing && !isDisabled) {
        const columnKey = params.key.toString();
        const error = context?.validationErrors?.[columnKey];

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const newValue =
            params.type === "number"
              ? parseFloat(e.target.value) || 0
              : e.target.value;

          const validation = validateValue(newValue, params.schema);
          context?.setValidationError?.(columnKey, validation.error);

          if (validation.isValid) {
            context?.onValueChange?.(params.key, newValue);
          }
        };

        return (
          <div className="w-full">
            <Input
              type={params.type || "text"}
              defaultValue={value?.toString() || ""}
              placeholder={params.placeholder}
              className={`${params.className} ${
                error ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
              onChange={handleChange}
            />
            {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
          </div>
        );
      }

      let displayValue = value?.toString() || "";
      if (params.transform) {
        displayValue = params.transform(value);
      }

      return displayValue;
    },
  }),

  // 날짜 컬럼
  Date: <T extends BaseItem>(
    params: PresetParams<{
      key: keyof T;
      label: string;
      format?: (date: Date) => string;
      placeholder?: string;
      disabled?: boolean | ((item: any) => boolean);
      schema?: z.ZodType<any>;
      crossValidation?: (value: any, allData: any) => string | null;
      relatedFields?: string[]; // 변경 시 함께 검증할 필드들
    }>
  ): ColumnDefinition<T> => ({
    ...params,
    render: (value, item, isEditing, context) => {
      const isDisabled = isDisabledField(params.disabled, item);

      if (isEditing && !isDisabled) {
        const columnKey = params.key.toString();
        const error = context?.validationErrors?.[columnKey];

        const handleDateChange = (date: Date | undefined) => {
          const dateString = date ? formatDate(date, "yyyy-MM-dd") : "";

          // 개별 필드 검증
          const validation = validateValue(dateString, params.schema);
          let finalError = validation.error;

          // 교차 검증 수행
          if (validation.isValid && params.crossValidation) {
            const allData = {
              ...item.data,
              ...context?.editingData,
              [params.key]: dateString,
            };
            const crossError = params.crossValidation(dateString, allData);
            if (crossError) finalError = crossError;
          }

          context?.setValidationError?.(columnKey, finalError);

          if (validation.isValid) {
            context?.onValueChange?.(params.key, dateString);

            // 관련 필드들의 검증도 재실행
            if (params.relatedFields && params.crossValidation) {
              const updatedData = {
                ...item.data,
                ...context?.editingData,
                [params.key]: dateString,
              };

              params.relatedFields.forEach((relatedField) => {
                if (updatedData[relatedField]) {
                  // 관련 필드의 교차 검증 수행
                  const relatedError = params.crossValidation!(
                    updatedData[relatedField],
                    updatedData
                  );
                  context?.setValidationError?.(relatedField, relatedError);
                }
              });
            }
          }
        };

        return (
          <div className="w-full">
            <DatePicker
              date={value ? new Date(value) : undefined}
              onDateChange={handleDateChange}
              placeholder={params.placeholder}
              className={
                error ? "border-red-500 focus-visible:ring-red-500" : ""
              }
            />
            {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
          </div>
        );
      }

      if (!value) return "";
      const dateObj = new Date(`${value}T00:00:00`);
      if (params.format) {
        return params.format(dateObj);
      }
      return dateObj.toLocaleDateString("ko-KR");
    },
  }),

  // 체크박스 컬럼
  CheckBox: <T extends BaseItem>(
    params: PresetParams<{
      key: keyof T;
      label: string;
      disabled?: boolean | ((item: any) => boolean);
      schema?: z.ZodType<any>;
    }>
  ): ColumnDefinition<T> => ({
    editable: true,
    ...params,
    render: (value, item, isEditing, context) => {
      const isDisabled = isDisabledField(params.disabled, item);

      if (isEditing && !isDisabled) {
        const columnKey = params.key.toString();
        const error = context?.validationErrors?.[columnKey];

        const handleCheckedChange = (checked: boolean | "indeterminate") => {
          const validation = validateValue(checked, params.schema);
          context?.setValidationError?.(columnKey, validation.error);

          if (validation.isValid) {
            context?.onValueChange?.(params.key, checked);
          }
        };

        return (
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center h-6">
              <Checkbox
                checked={!!value}
                onCheckedChange={handleCheckedChange}
                className={
                  error ? "border-red-500 data-[state=checked]:bg-red-500" : ""
                }
              />
            </div>
            {error && (
              <div className="text-xs text-red-500 mt-1 text-center max-w-[120px]">
                {error}
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center h-6">
          <Checkbox checked={!!value} disabled={true} />
        </div>
      );
    },
  }),

  // 선택 드롭다운 컬럼
  Select: <T extends BaseItem>(
    params: PresetParams<{
      key: keyof T;
      label: string;
      options: { label: string; value: any }[];
      placeholder?: string;
      disabled?: boolean | ((item: any) => boolean);
      className?: string;
      schema?: z.ZodType<any>;
    }>
  ): ColumnDefinition<T> => ({
    editable: true,
    ...params,
    render: (value, item, isEditing, context) => {
      const isDisabled = isDisabledField(params.disabled, item);

      if (isEditing && !isDisabled) {
        const columnKey = params.key.toString();
        const error = context?.validationErrors?.[columnKey];

        const handleValueChange = (newValue: string) => {
          const validation = validateValue(newValue, params.schema);
          context?.setValidationError?.(columnKey, validation.error);

          if (validation.isValid) {
            context?.onValueChange?.(params.key, newValue);
          }
        };

        return (
          <div className="w-full">
            <Select defaultValue={value} onValueChange={handleValueChange}>
              <SelectTrigger
                className={`${params.className} ${
                  error ? "border-red-500 ring-red-500" : ""
                }`}
              >
                <SelectValue placeholder={params.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {params.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
          </div>
        );
      } else if (isEditing && isDisabled) {
        const option = params.options?.find((opt) => opt.value === value);
        return (
          <div className="flex items-center gap-2">
            <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded text-sm">
              {option?.label || value?.toString() || ""}
            </span>
          </div>
        );
      }

      const option = params.options?.find((opt) => opt.value === value);
      return option?.label || value?.toString() || "";
    },
  }),

  // 체크박스 선택 컬럼 (행 선택용)
  CheckSelect: <T extends BaseItem>(
    params?: PresetParams<{
      onSelectionChange?: (selectedIds: (number | string)[]) => void;
      disabled?: boolean | ((item: any) => boolean);
    }>
  ): ColumnDefinition<T> => ({
    key: "__checkbox__" as const,
    label: "",
    ...params,
    render: (_, item, __, context) => {
      const isHeader = !item?.data || Object.keys(item).length === 0;

      if (isHeader) {
        return (
          <div
            className={`flex items-center justify-center h-6 ${params?.className}`}
          >
            <Checkbox
              checked={context?.allSelected || false}
              onCheckedChange={context?.onSelectAll}
              aria-label="모두 선택"
            />
          </div>
        );
      }

      const isDisabled = isDisabledField(params?.disabled, item);

      return (
        <div
          className={`flex items-center justify-center h-6 ${params?.className}`}
        >
          <Checkbox
            checked={context?.isSelected || false}
            onCheckedChange={(checked) => {
              if (!isDisabled) {
                context?.onSelectionChange?.(item.index, checked as boolean);
              }
            }}
            aria-label={`${item.data.name || item.index} 선택`}
            disabled={isDisabled}
          />
        </div>
      );
    },
  }),

  // 커스텀 컬럼
  Custom: <T extends BaseItem>(
    params: PresetParams<{
      key: keyof T;
      label: string;
      renderCell: (
        value: any,
        item: T,
        isEditing: boolean,
        context?: any
      ) => React.ReactNode;
      schema?: z.ZodType<any>;
    }>
  ): ColumnDefinition<T> => ({
    ...params,
    editable: true,
    render: (value, item, isEditing, context) => {
      return params.renderCell?.(value, item.data, isEditing, context);
    },
  }),
};
