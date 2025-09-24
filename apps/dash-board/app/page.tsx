// admin page 관리자만 접근 허용

import Link from "next/link";

export default function Home() {
  return (
    <div>
      DashBoard임
      <Link href="/users">Users</Link>
    </div>
  );
}
