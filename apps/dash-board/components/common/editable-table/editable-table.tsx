import { generateUUID } from "@workspace/util";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  BaseItem,
  ColumnDefinition,
  EditableTableMethods,
  EditableTableProps,
  ManageableItem,
} from "./types";

export const EditableTable = forwardRef<
  EditableTableMethods<any>,
  EditableTableProps<any>
>(function EditableTable<T extends BaseItem>(
  {
    data: initialData,
    columns,
    onDataChange,
    onSelectionChange,
    onRowClick,
    newItemTemplate = {} as Partial<T>,
    className,
    showActions = false,
    toolbarActions = [],
    context: externalContext,
  }: EditableTableProps<T>,
  ref: React.Ref<EditableTableMethods<T>>
) {
  // 상태 관리
  const [manageableData, setManageableData] = useState<ManageableItem<T>[]>(
    Array.isArray(initialData)
      ? initialData.map((item, index) => ({
          data: item,
          isNew: false,
          isDeleted: false,
          originalData: { ...item },
          index,
        }))
      : []
  );

  // 편집 상태
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<T>>({});
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string | null;
  }>({});

  // 선택 상태 관리
  const [selectedIndices, setSelectedIndices] = useState<Set<number | string>>(
    new Set()
  );

  // initialData가 변경될 때 manageableData 업데이트
  useEffect(() => {
    setManageableData(
      Array.isArray(initialData)
        ? initialData.map((item, index) => ({
            data: item,
            isNew: false,
            isDeleted: false,
            originalData: { ...item },
            index,
          }))
        : []
    );
    setSelectedIndices(new Set());
  }, [initialData]);

  // 메모이제이션된 계산들
  const checkSelectColumn = useMemo(() => {
    return columns.find((col) => col.key === "__checkbox__");
  }, [columns]);

  const selectableItems = useMemo(() => {
    return manageableData.filter((item) => {
      if (item.isDeleted) return false;

      if (checkSelectColumn && "disabled" in checkSelectColumn) {
        const disabledCondition = (checkSelectColumn as any).disabled;
        if (typeof disabledCondition === "function") {
          return !disabledCondition(item);
        } else if (typeof disabledCondition === "boolean") {
          return !disabledCondition;
        }
      }

      return true;
    });
  }, [manageableData, checkSelectColumn]);

  const allSelected = useMemo(() => {
    return (
      selectedIndices.size === selectableItems.length &&
      selectableItems.length > 0
    );
  }, [selectedIndices.size, selectableItems.length]);

  // 메모이제이션된 행 상태 계산
  const rowVariants = useMemo(() => {
    const variants = new Map<
      number,
      "default" | "added" | "modified" | "deleted"
    >();

    manageableData.forEach((item) => {
      if (item.isDeleted) {
        variants.set(item.index, "deleted");
      } else if (item.isNew) {
        variants.set(item.index, "added");
      } else if (item.originalData) {
        const isModified = Object.keys(item.originalData).some((key) => {
          return item.data[key] !== item.originalData![key];
        });
        variants.set(item.index, isModified ? "modified" : "default");
      } else {
        variants.set(item.index, "default");
      }
    });

    return variants;
  }, [manageableData]);

  // 상태별 행 필터링 함수
  const getRowsByStatus = useCallback((data: ManageableItem<T>[]) => {
    const deleted = data
      .filter((item) => item.isDeleted)
      .map((item) => ({
        ...item.data,
        flag: "D" as const,
      }));

    const modified = data
      .filter(
        (item) =>
          !item.isDeleted &&
          !item.isNew &&
          item.originalData &&
          Object.keys(item.originalData).some((key) => {
            return item.data[key] !== item.originalData![key];
          })
      )
      .map((item) => ({
        ...item.data,
        flag: "M" as const,
      }));

    const added = data
      .filter((item) => item.isNew && !item.isDeleted)
      .map((item) => ({
        ...item.data,
        flag: "U" as const,
      }));

    return {
      deleted,
      modified,
      added,
      all: [...deleted, ...modified, ...added],
    };
  }, []);

  // 데이터 변경 시 부모에게 알림
  const notifyDataChange = useCallback(
    (newData: ManageableItem<T>[]) => {
      const statusData = getRowsByStatus(newData);
      onDataChange?.(newData, statusData);
    },
    [onDataChange, getRowsByStatus]
  );

  // 저장 버튼 비활성화 상태 계산
  const isSaveDisabled = useMemo(() => {
    return Object.values(validationErrors).some((error) => error !== null);
  }, [validationErrors]);

  // 편집 시작
  const startEdit = useCallback((item: ManageableItem<T>) => {
    setEditingIndex(item.index);
    setEditingData({ ...item.data });
    setValidationErrors({});
  }, []);

  // 편집 저장
  const saveEdit = useCallback(() => {
    if (editingIndex === null || isSaveDisabled) return;

    const newData = manageableData.map((item) =>
      item.index === editingIndex
        ? {
            ...item,
            data: { ...item.data, ...editingData } as T,
          }
        : item
    );

    setManageableData(newData);
    notifyDataChange(newData);
    setEditingIndex(null);
    setEditingData({});
    setValidationErrors({});
  }, [
    editingIndex,
    isSaveDisabled,
    manageableData,
    editingData,
    notifyDataChange,
  ]);

  // 편집 취소
  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditingData({});
    setValidationErrors({});
  }, []);

  // 새 항목 추가
  const addNewItem = useCallback(() => {
    const newIndex = manageableData.length;
    // 새 항목에 고유 식별자를 제공하기 위한 내부 타입만 생성
    const _internalId = generateUUID();

    const newItem: ManageableItem<T> = {
      data: {
        ...newItemTemplate,
        _internalId, // 내부적인 식별을 위해 추가하나 실제 데이터에는 노출되지 않음
      } as unknown as T,
      isNew: true,
      isDeleted: false,
      index: newIndex,
    };

    const newData = [...manageableData, newItem];
    setManageableData(newData);
    notifyDataChange(newData);

    setEditingIndex(newIndex);
    setEditingData({ ...newItemTemplate } as Partial<T>);

    // 새 항목 추가 시 각 컬럼의 스키마를 활용한 필수 필드 검증
    const initialErrors: { [key: string]: string | null } = {};
    columns.forEach((column) => {
      if (column.key !== "__checkbox__" && typeof column.key === "string") {
        const columnKey = column.key.toString();
        const initialValue =
          newItemTemplate[column.key as keyof typeof newItemTemplate];

        // 컬럼 정의에서 스키마 추출하여 검증 (ColumnPresets의 params에서)
        const columnDef = column as any;
        if (columnDef.schema) {
          try {
            columnDef.schema.parse(initialValue);
          } catch (error: any) {
            if (error?.errors?.[0]?.message) {
              initialErrors[columnKey] = error.errors[0].message;
            }
          }
        }
      }
    });

    setValidationErrors(initialErrors);
  }, [manageableData, newItemTemplate, notifyDataChange, columns]);

  const deleteSelectedItems = useCallback(() => {
    const newData = manageableData
      .map((item) => {
        if (selectedIndices.has(item.index)) {
          if (item.isNew) {
            return null;
          } else {
            return { ...item, isDeleted: !item.isDeleted };
          }
        }
        return item;
      })
      .filter(Boolean) as ManageableItem<T>[];

    setManageableData(newData);
    notifyDataChange(newData);
    setSelectedIndices(new Set());
    onSelectionChange?.([]);
  }, [manageableData, selectedIndices, notifyDataChange, onSelectionChange]);

  const getSelectedItems = useCallback(() => {
    return manageableData
      .filter((item) => selectedIndices.has(item.index))
      .map((item) => item.data);
  }, [manageableData, selectedIndices]);

  // ref를 통해 노출할 메서드들
  useImperativeHandle(
    ref,
    () => ({
      getCurrentData: () => manageableData,
      getStatusData: () => getRowsByStatus(manageableData),
      addNewItem,
      deleteSelectedItems,
      getSelectedItems,
    }),
    [
      manageableData,
      getRowsByStatus,
      addNewItem,
      deleteSelectedItems,
      getSelectedItems,
    ]
  );

  // 개별 항목 선택/해제
  const handleItemSelection = useCallback(
    (index: number, selected: boolean) => {
      const newSelectedIds = new Set(selectedIndices);
      if (selected) {
        newSelectedIds.add(index);
      } else {
        newSelectedIds.delete(index);
      }
      setSelectedIndices(newSelectedIds);

      const selectedData = manageableData
        .filter((item) => newSelectedIds.has(item.index))
        .map((item) => item.data);

      onSelectionChange?.(selectedData);
    },
    [selectedIndices, manageableData, onSelectionChange]
  );

  // 전체 선택/해제
  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        const selectableIds = selectableItems.map((item) => item.index);
        setSelectedIndices(new Set(selectableIds));
        const selectedData = selectableItems.map((item) => item.data);
        onSelectionChange?.(selectedData);
      } else {
        setSelectedIndices(new Set());
        onSelectionChange?.([]);
      }
    },
    [selectableItems, onSelectionChange]
  );

  // 메모이제이션된 context 객체
  const contextMemo = useMemo(
    () => ({
      onValueChange: (key: any, newValue: any) => {
        setEditingData((prev) => ({
          ...prev,
          [key]: newValue,
        }));
      },
      validationErrors,
      setValidationError: (key: string, errorMessage: string | null) => {
        setValidationErrors((prev) => ({
          ...prev,
          [key]: errorMessage,
        }));
      },
      onSelectionChange: handleItemSelection,
      allSelected,
      onSelectAll: handleSelectAll,
      editingData,
      columns,
    }),
    [
      validationErrors,
      handleItemSelection,
      allSelected,
      handleSelectAll,
      editingData,
      columns,
    ]
  );

  // 편집 가능한 셀 렌더링
  const renderEditableCell = useCallback(
    (column: ColumnDefinition<T>, item: ManageableItem<T>) => {
      const isEditing = editingIndex === item.index;
      const value =
        isEditing && editingData[column.key] !== undefined
          ? editingData[column.key]
          : item.data[column.key];

      const context = {
        ...contextMemo,
        ...externalContext,
        isSelected: selectedIndices.has(item.index),
      };

      if (column.render) {
        return column.render(value, item, isEditing, context);
      }

      if (isEditing && column.editable !== false) {
        return (
          <Input
            value={editingData[column.key]?.toString() || ""}
            onChange={(e) =>
              setEditingData((prev) => ({
                ...prev,
                [column.key]: e.target.value,
              }))
            }
            className="w-full"
          />
        );
      }

      return value?.toString() || "";
    },
    [editingIndex, editingData, contextMemo, selectedIndices]
  );

  return (
    <div className={cn(className, "text-sm")}>
      {toolbarActions.length > 0 && (
        <div className="mb-4 flex justify-end gap-2">
          {toolbarActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant={action.variant || "outline"}
              size="sm"
              disabled={action.disabled}
              className="flex items-center gap-1"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* 테이블 컨테이너: 좌우 스크롤 제어 */}
      <div className="w-full overflow-x-auto border rounded-md">
        {/* 상하 스크롤 제어 */}
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            {/* 헤더: sticky로 상하 스크롤 시에만 고정, 좌우 스크롤 시 함께 이동 */}
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow className="h-10">
                {columns.map((column) => (
                  <TableHead
                    key={column.key.toString()}
                    className={cn(column.className, "text-center")}
                  >
                    {column.key === "__checkbox__" && column.render
                      ? column.render(null, {} as ManageableItem<T>, false, {
                          allSelected,
                          onSelectAll: handleSelectAll,
                        })
                      : column.label}
                  </TableHead>
                ))}
                {showActions && (
                  <TableHead className="w-[120px]">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            {/* 바디: 스크롤 가능 */}
            <TableBody>
              {manageableData.map((item) => (
                <TableRow
                  key={item.index}
                  variant={rowVariants.get(item.index) || "default"}
                  className={cn(
                    "h-10",
                    onRowClick ? "cursor-pointer hover:bg-gray-50" : ""
                  )}
                  onClick={() => onRowClick?.(item.data)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key.toString()}
                      className={cn(column.className, "align-middle")}
                    >
                      {renderEditableCell(column, item)}
                    </TableCell>
                  ))}
                  {showActions && (
                    <TableCell className="w-[120px] align-middle">
                      <div className="flex gap-1 justify-center">
                        {editingIndex === item.index ? (
                          <>
                            <Button
                              onClick={saveEdit}
                              variant="outline"
                              size="sm"
                              className={cn(
                                "text-xs px-2 py-1",
                                isSaveDisabled
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-green-600 hover:text-green-700"
                              )}
                              disabled={isSaveDisabled}
                              title={
                                isSaveDisabled
                                  ? "유효성 검증 오류가 있습니다"
                                  : "저장"
                              }
                            >
                              저장
                            </Button>
                            <Button
                              onClick={cancelEdit}
                              variant="outline"
                              size="sm"
                              className="text-xs text-gray-600 hover:text-gray-700 px-2 py-1"
                            >
                              취소
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => startEdit(item)}
                            variant="outline"
                            size="sm"
                            className="text-xs px-2 py-1"
                          >
                            수정
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
});
