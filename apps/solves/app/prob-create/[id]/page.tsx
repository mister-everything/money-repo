"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProbCreateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  useEffect(() => {
    // [id] 페이지는 더 이상 사용하지 않음
    // edit/[id]로 리다이렉트
    router.replace(`/prob-create/edit/${params.id}`);
  }, [params.id, router]);

  return null;
}
