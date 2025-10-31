import { wait } from "@workspace/util";
import { redirect } from "next/navigation";

export default async function AboutYouPage() {
  await wait(5000);
  `정책 동의 및 사용자 개인정보 등록 화면`;
  return redirect("/");
}
