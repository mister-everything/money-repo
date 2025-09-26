import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <Card className="w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Auth Error</CardTitle>
          <CardDescription>{error ?? "Unknown error"}</CardDescription>
        </CardHeader>
        <CardContent>담당자에게 문의해주세요.</CardContent>
      </Card>
    </div>
  );
}
