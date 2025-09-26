// admin page 관리자만 접근 허용

import Link from "next/link";
import { getUser } from "@/lib/auth/server";

export default async function Home() {
  const user = await getUser();

  return (
    <div>
      {user.name}님 안녕하세요 DashBoard입니다
      <Link href="/users">Users</Link>
    </div>
  );
}
