// 기본 아이템 인터페이스 (id는 필수)
export interface BaseItem {
  [key: string]: any;
}

// 관리 가능한 아이템 타입
export interface ManageableItem<T extends BaseItem> {
  data: T;
  isNew: boolean;
  isDeleted: boolean;
  originalData?: T;
  index: number;
}

// 컬럼 정의 타입
export interface ColumnDefinition<T extends BaseItem> {
  key: any; // 완전히 유연한 키 타입
  label: string;
  className?: string; // 추가 테일윈드 클래스 (기본 스타일에 추가됨)
  editable?: boolean;
  render?: (
    value: any,
    item: ManageableItem<T>,
    isEditing: boolean,
    context?: {
      isSelected?: boolean;
      onSelectionChange?: (index: number, selected: boolean) => void;
      allSelected?: boolean;
      onSelectAll?: (selected: boolean) => void;
      onValueChange?: (key: any, value: any) => void;
      setValidationError?: (key: any, error: string | null) => void;
      validationErrors?: { [key: string]: string | null };
      editingData?: any;
      columns?: ColumnDefinition<any>[];
    },
  ) => React.ReactNode;
}

// 상태별 데이터 타입
export interface StatusData<T extends BaseItem> {
  deleted: (T & { flag: "D" })[];
  modified: (T & { flag: "M" })[];
  added: (T & { flag: "U" })[];
  all: (T & { flag: "D" | "M" | "U" })[];
}

// 툴바 액션 타입
export interface ToolbarAction {
  label: string;
  onClick: () => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  disabled?: boolean;
  icon?: React.ReactNode;
}

// 테이블 메서드 인터페이스 (ref로 노출될 메서드들)
export interface EditableTableMethods<T extends BaseItem> {
  getCurrentData: () => ManageableItem<T>[];
  getStatusData: () => StatusData<T>;
  addNewItem: () => void;
  deleteSelectedItems: () => void;
  getSelectedItems: () => T[];
}

// 컴포넌트 Props 타입
export interface EditableTableProps<T extends BaseItem> {
  data: T[];
  columns: ColumnDefinition<T>[];
  onDataChange?: (data: ManageableItem<T>[], statusData: StatusData<T>) => void;
  onSelectionChange?: (selectedData: T[]) => void;
  onRowClick?: (item: T) => void;
  newItemTemplate?: Partial<T>;
  className?: string;
  showActions?: boolean;
  toolbarActions?: ToolbarAction[];
  context?: any;
}
