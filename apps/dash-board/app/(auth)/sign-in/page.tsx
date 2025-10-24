import SignInForm from "./sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const params = await searchParams;
  const inviteToken = params.invite;

  return <SignInForm inviteToken={inviteToken} />;
}
