"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardMetrics } from "@/components/dashboard-metrics";
import { UsersTable } from "./components/users-table";

// 사용자 타입 정의
interface User {
  id: string;
  name?: string;
  email: string;
  role: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 사용자 목록 가져오기
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("사용자 목록을 가져오는데 실패했습니다.");
      }

      const data = await response.json();
      // Date 타입으로 변환
      const transformedUsers = data.map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      }));

      setUsers(transformedUsers);
    } catch (err) {
      console.error("사용자 목록 조회 에러:", err);
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 사용자 목록 가져오기
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-black min-h-screen">
        <DashboardMetrics />
        <div className="mt-8 text-center">
          <p className="text-white">사용자 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6 bg-black min-h-screen">
        <DashboardMetrics />
        <div className="mt-8 text-center">
          <p className="text-red-400">오류: {error}</p>
          <button
            onClick={fetchUsers}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-black min-h-screen">
      <DashboardMetrics />
      {/* 나중에 검색영역 추가 ㅇㅇ */}
      <div className="mt-8">
        <UsersTable users={users} onRefresh={fetchUsers} />
      </div>
      낄낄
    </div>
  );
}
