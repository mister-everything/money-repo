"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProbCreateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    // [id] 페이지는 더 이상 사용하지 않음
    // edit/[id]로 리다이렉트
    router.replace(`/prob-create/edit/${id}`);
  }, [id, router]);

  return null;
}
