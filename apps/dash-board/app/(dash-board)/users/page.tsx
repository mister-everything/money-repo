"use client";

import useSWR from "swr";
import { DashboardMetrics } from "@/components/dashboard-metrics";
import { UsersTable } from "@/components/users/users-table";

// 사용자 타입 정의
interface User {
  id: string;
  name?: string;
  email: string;
  role: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// SWR fetcher 함수
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("사용자 목록을 가져오는데 실패했습니다.");
  }
  const data = await response.json();

  // Date 타입으로 변환
  return data.map((user: any) => ({
    ...user,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  }));
};

export default function UsersPage() {
  const {
    data: users = [],
    error,
    isLoading,
    mutate: refreshUsers,
  } = useSWR<User[]>("/api/users", fetcher, {
    revalidateOnFocus: false, // 포커스할 때 자동 재검증 비활성화
    revalidateOnReconnect: true, // 네트워크 재연결 시 재검증
    dedupingInterval: 60000, // 1분간 중복 요청 방지
  });

  if (isLoading) {
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
          <p className="text-red-400">오류: {error.message}</p>
          <button
            onClick={() => refreshUsers()}
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
        <UsersTable users={users} onRefresh={refreshUsers} />
      </div>
    </div>
  );
}
