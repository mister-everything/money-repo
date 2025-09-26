import { Download } from "lucide-react";
import { useRef, useState } from "react";
import { EditableTable } from "@/components/common/editable-table/editable-table";
import { ColumnPresets } from "@/components/common/editable-table/presets";
import {
  ColumnDefinition,
  EditableTableMethods,
} from "@/components/common/editable-table/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { notify } from "@/components/ui/notify";

// 타입 정의 어디다 해야하는지
interface User {
  id: string;
  name?: string;
  email: string;
  role: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UsersTableProps {
  users: User[];
  onRefresh?: () => void;
}

const statusRoles = ["admin", "user"];

const usersColumns: ColumnDefinition<User>[] = [
  ColumnPresets.Text({
    key: "name",
    label: "사용자",
    className: "w-[200px]",
    editable: false,
  }),
  ColumnPresets.Text({
    key: "email",
    label: "이메일",
    className: "w-[170px]",
    editable: false,
  }),
  ColumnPresets.Select({
    key: "role",
    label: "역할",
    className: "w-[120px]",
    options: statusRoles.map((role) => ({ label: role, value: role })),
  }),
  ColumnPresets.Date({
    key: "createdAt",
    label: "생성일",
    className: "w-[150px]",
    editable: false,
    format: (date) => date.toLocaleString(),
  }),
  ColumnPresets.Date({
    key: "updatedAt",
    label: "수정일",
    className: "w-[150px]",
    editable: false,
    format: (date) => date.toLocaleString(),
  }),
];

export const UsersTable = ({ users, onRefresh }: UsersTableProps) => {
  const usersTableRef = useRef<EditableTableMethods<User>>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveChanges = async () => {
    const statusData = usersTableRef.current?.getStatusData();
    if (!statusData || statusData.all.length === 0) {
      notify.alert({
        title: "알림",
        description: "저장할 변경사항이 없습니다.",
      });
      return;
    }

    setIsSaving(true);
    try {
      await Promise.all(
        statusData.modified.map(async (user) => {
          const response = await fetch(`/api/users/${user.id}/role`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ role: user.role }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "역할 업데이트에 실패했습니다.");
          }

          return response.json();
        })
      );

      notify.alert({
        title: "저장 완료",
        description: `${statusData.modified.length}명의 사용자 역할이 성공적으로 업데이트되었습니다.`,
      });

      // 데이터 새로고침
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("사용자 역할 업데이트 실패:", error);
      notify.alert({
        title: "저장 실패",
        description:
          error instanceof Error
            ? error.message
            : "변경사항 저장에 실패했습니다.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (users.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-12 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            등록된 사용자가 없습니다
          </h3>
          <p className="text-gray-400">
            아직 등록된 사용자가 없습니다. 새로운 사용자가 가입하면 여기에
            표시됩니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">사용자 관리</CardTitle>
        <CardDescription className="text-gray-400">
          등록된 사용자들을 관리하고 확인할 수 있습니다. 역할을 클릭하여 수정할
          수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-900">
          <EditableTable
            ref={usersTableRef}
            data={users}
            columns={usersColumns}
            showActions={true}
            className="bg-gray-900 text-white"
            toolbarActions={[
              {
                label: isSaving ? "저장 중..." : "변경사항 저장",
                onClick: handleSaveChanges,
                icon: <Download className="h-4 w-4" />,
                disabled: isSaving,
              },
            ]}
          />
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            총 {users.length}명의 사용자가 등록되어 있습니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
