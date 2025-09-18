"use client";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const LightRays = dynamic(() => import("@/components/ui/light-rays"), {
  ssr: false,
});

const Particles = dynamic(() => import("@/components/ui/particles"), {
  ssr: false,
});

const teamMembers = [
  {
    name: "cgoing",
    email: "neo.cgoing@gmail.com",
    profile: "https://ui.shadcn.com/avatars/01.png",
  },
  {
    name: "jack",
    email: "jooc0311@gmail.com",
    profile: "https://ui.shadcn.com/avatars/02.png",
  },
  {
    name: "bob",
    email: "bobob935@gmail.com",
    profile: "https://ui.shadcn.com/avatars/03.png",
  },
  {
    name: "jot san",
    email: "dlstks15@naver.com",
    profile: "https://ui.shadcn.com/avatars/04.png",
  },
];

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-svh relative">
      <div className="absolute top-0 right-0 z-10 p-4">
        <Link href="/sign-in">
          <Button variant={"ghost"}>로그인</Button>
        </Link>
      </div>
      <AnimatePresence>
        <motion.div
          className="-z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 5 }}
        >
          <div className="absolute top-0 left-0 w-full h-full z-10">
            <LightRays />
          </div>
          <div className="absolute top-0 left-0 w-full h-full z-10">
            <Particles particleCount={400} particleBaseSize={10} />
          </div>

          <div className="absolute top-0 left-0 w-full h-full z-10">
            <div className="w-full h-full bg-gradient-to-t from-background to-50% to-transparent z-20" />
          </div>
          <div className="absolute top-0 left-0 w-full h-full z-10">
            <div className="w-full h-full bg-gradient-to-l from-background to-20% to-transparent z-20" />
          </div>
          <div className="absolute top-0 left-0 w-full h-full z-10">
            <div className="w-full h-full bg-gradient-to-r from-background to-20% to-transparent z-20" />
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex px-4 flex-col items-center justify-center gap-4 w-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Solves Team Members</CardTitle>
            <CardDescription>
              Opening soon—thanks for waiting, it’ll be worth it!
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {teamMembers.map((member) => (
              <div key={member.email} className="flex items-center gap-2">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={member.profile} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
