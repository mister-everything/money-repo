import { nextBetterAuthForAdmin } from "@service/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const getSession = async () => {
  "use server";
  const session = await nextBetterAuthForAdmin.api
    .getSession({
      headers: await headers(),
    })
    .catch((e) => {
      console.error(e);
      return null;
    });
  if (!session) {
    console.error("No session found");
    redirect("/sign-in");
  }
  return session!;
};

export const getUser = async () => {
  "use server";
  const session = await getSession();
  return session.user;
};
