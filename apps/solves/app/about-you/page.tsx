import { Onboarding } from "@/components/onboarding/onboarding";
import { getSession } from "@/lib/auth/server";

export default async function Page() {
  const session = await getSession();

  const initialUserData = {
    nickname: session.user.nickname ?? "",
    image: session.user.image ?? "",
  };

  return (
    <div className="overflow-hidden w-full h-screen flex items-center justify-center">
      <Onboarding
        steps={["nickname", "image", "theme", "policy"]}
        initialUserData={initialUserData}
      />
    </div>
  );
}
