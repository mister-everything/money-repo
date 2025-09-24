import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/auth/server";

export default async function AdminPage() {
  const session = await getSession();

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Card className="w-sm">
        <CardHeader className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={session.user.image ?? ""} />
            <AvatarFallback>{session.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-around">
            <CardTitle>{session.user.name}</CardTitle>
            <CardDescription>{session.user.email}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
