import { Download, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { mutate } from "swr";
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
// 789,990 1611115
// 406,600,383,390 + 701,125, 120,000
// 73000 574125 28000 14000 58500 23000 3500 : 774125
// 110000 58000 15000 23100 5000 18500 98000: 327600
const usersColumns: ColumnDefinition<User>[] = [
  ColumnPresets.CheckSelect({
    className: "w-[50px]",
  }),
  ColumnPresets.Text({
    key: "name",
    label: "사용자",
    className: "w-[200px]",
  }),
  ColumnPresets.Text({
    key: "email",
    label: "이메일",
    className: "w-[170px]",
  }),
  ColumnPresets.Select({
    key: "role",
    label: "역할",
    className: "w-[120px]",
    disabled: false,
    options: statusRoles.map((role) => ({ label: role, value: role })),
  }),
  ColumnPresets.Text({
    key: "createdAt",
    label: "생성일",
    className: "w-[150px]",
    transform: (date) => date.toLocaleString(),
  }),
  ColumnPresets.Text({
    key: "updatedAt",
    label: "수정일",
    className: "w-[150px]",
    transform: (date) => date.toLocaleString(),
  }),
];

export const UsersTable = ({ users, onRefresh }: UsersTableProps) => {
  const usersTableRef = useRef<EditableTableMethods<User>>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 선택된 항목을 삭제 예정으로 표시
  const handleMarkForDeletion = () => {
    const selectedItems = usersTableRef.current?.getSelectedItems();
    if (!selectedItems || selectedItems.length === 0) {
      notify.alert({
        title: "알림",
        description: "삭제할 사용자를 선택해주세요.",
      });
      return;
    }

    usersTableRef.current?.deleteSelectedItems();

    notify.alert({
      title: "삭제 예정",
      description: `${selectedItems.length}명의 사용자가 삭제 예정으로 표시되었습니다. "변경사항 저장"을 클릭하여 실제로 삭제하세요.`,
    });
  };

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
      const promises: Promise<any>[] = [];

      // 1. 역할 수정 처리
      if (statusData.modified.length > 0) {
        // 낙관적 업데이트: 먼저 UI에서 변경사항을 반영
        const updatedUsers = users.map((user) => {
          const modifiedUser = statusData.modified.find(
            (mod) => mod.id === user.id
          );
          return modifiedUser ? { ...user, role: modifiedUser.role } : user;
        });

        // SWR 캐시를 낙관적으로 업데이트
        mutate("/api/users", updatedUsers, false);

        // 역할 업데이트 API 호출들을 promises에 추가
        promises.push(
          ...statusData.modified.map(async (user) => {
            const response = await fetch(`/api/users/${user.id}/role`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ role: user.role }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.error || "역할 업데이트에 실패했습니다."
              );
            }

            return response.json();
          })
        );
      }

      // 2. 사용자 삭제 처리
      if (statusData.deleted.length > 0) {
        // 삭제 API 호출들을 promises에 추가
        promises.push(
          ...statusData.deleted.map(async (user) => {
            const response = await fetch(`/api/users/${user.id}`, {
              method: "DELETE",
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "사용자 삭제에 실패했습니다.");
            }

            return response.json();
          })
        );
      }

      // 모든 API 호출을 병렬로 실행
      await Promise.all(promises);

      // 성공 시 서버에서 최신 데이터 가져오기
      mutate("/api/users");

      // 성공 메시지 구성
      const messages: string[] = [];
      if (statusData.modified.length > 0) {
        messages.push(`${statusData.modified.length}명의 역할 수정`);
      }
      if (statusData.deleted.length > 0) {
        messages.push(`${statusData.deleted.length}명의 사용자 삭제`);
      }

      notify.alert({
        title: "저장 완료",
        description: `${messages.join(", ")}이 성공적으로 완료되었습니다.`,
      });

      // 선택적으로 onRefresh 콜백 실행 (SWR 사용 시 필요 없을 수도 있음)
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("사용자 역할 업데이트 실패:", error);

      // 에러 발생 시 원래 데이터로 되돌리기
      mutate("/api/users");

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
          등록된 사용자들을 관리하고 확인할 수 있습니다. 역할을 클릭하여
          수정하거나, 사용자를 선택하여 삭제할 수 있습니다.
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
                label: "선택 삭제",
                onClick: handleMarkForDeletion,
                icon: <Trash2 className="h-4 w-4" />,
                disabled: isSaving,
                variant: "outline",
              },
              {
                label: "변경사항 저장",
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
