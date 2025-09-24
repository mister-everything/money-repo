// admin page 관리자만 접근 허용

import Link from "next/link";

export default function Home() {
  return (
    <div>
      DashBoard입니다
      <Link href="/users">Users</Link>
    </div>
  );
}
