import { nextBetterAuth } from "@service/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const getSession = async () => {
  "use server";
  const session = await nextBetterAuth.api
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

export const safeGetUser = async () => {
  "use server";
  const session = await nextBetterAuth.api
    .getSession({
      headers: await headers(),
    })
    .catch((e) => {
      console.error(e);
      return null;
    });
  return session?.user;
};
