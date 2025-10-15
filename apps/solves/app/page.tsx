import { probService } from "@service/solves";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { safeGetUser } from "@/lib/auth/server";

export default async function Page() {
  const user = await safeGetUser();

  const probBooks = await probService.searchProbBooks();

  return (
    <div className="flex items-center justify-center min-h-svh relative">
      <div className="absolute top-0 right-0 z-10 p-4">
        {!user ? (
          <Link href="/sign-in">
            <Button variant={"ghost"}>로그인</Button>
          </Link>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2" variant={"ghost"}>
                <Avatar className="size-4">
                  <AvatarImage src={user.image ?? ""} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground">{user.name}</p>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Link href="/account">
                  <Button variant={"ghost"}>계정</Button>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="w-full mx-auto max-w-3xl px-6 flex flex-wrap gap-4">
        {probBooks.map((probBook) => (
          <Link href={`/prob-book/${probBook.id}`} key={probBook.id}>
            <Card className="w-sm hover:bg-secondary">
              <CardHeader>
                <CardTitle>{probBook.title}</CardTitle>
                <div className="flex items-center justify-end gap-2">
                  {probBook.tags.map((tag) => (
                    <Badge variant={"secondary"} key={tag}>
                      {tag}
                    </Badge>
                  ))}
                </div>
                <CardDescription>{probBook.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm justify-end">
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-2">
                        created by{" "}
                        <Avatar className="size-6 ring">
                          <AvatarImage src={probBook.owner.profile ?? ""} />
                          <AvatarFallback>
                            {probBook.owner.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{probBook.owner.name}</TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
