import { userService } from "@service/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

//user list 싹 간다
export default async function UsersPage() {
  const users = await userService.getEnableUsers();

  return (
    <div className="w-full h-screen  flex flex-col gap-4">
      {users.length == 0 && <div> 나가</div>}
      {users.map((user) => {
        return (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle>{user.id}</CardTitle>
              <CardDescription>{user.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{user.email}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
