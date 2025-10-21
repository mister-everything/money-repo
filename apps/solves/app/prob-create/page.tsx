"use client";

import { useRouter } from "next/navigation";
import React from "react";

export default function ProbCreatePage() {
  const router = useRouter();

  React.useEffect(() => {
    // 새로운 문제집 생성 페이지로 리다이렉트
    router.push("/prob-create/new");
  }, [router]);

  return null;
}
