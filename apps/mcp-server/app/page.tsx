"use client";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, CopyIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import JsonView from "@/components/ui/json-view";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-svh relative">
      <AnimatePresence>
        <motion.div
          className="-z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 5 }}
        >
          <div className="absolute top-0 left-0 w-full h-full z-10 ">
            <Particles />
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex px-4 flex-col items-center justify-center gap-4 w-full">
        <Card className="w-full max-w-lg bg-transparent border-none shadow-none">
          <CardHeader>
            <CardTitle>MCP Server</CardTitle>
            <CardDescription className="my-4">
              <div className="flex flex-col rounded p-2 bg-background/90 w-full border ">
                <Button
                  size="icon"
                  variant="ghost"
                  className="cursor-pointer ml-auto"
                  onClick={handleCopy}
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </Button>
                <div className="p-4">
                  <JsonView
                    initialExpandDepth={5}
                    data={{
                      mcpServers: {
                        moneyRepo: {
                          url: "https://money-repo-tools.vercel.app/mcp",
                          headers: {
                            Authorization: "Bearer ${your_token}",
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">by</span>
            {teamMembers.map((member, index) => (
              <Tooltip key={member.email}>
                <TooltipTrigger>
                  <div key={member.email} className="flex items-center">
                    <div className="flex items-center">
                      <Avatar
                        className={`border size-6 ${
                          index > 0 ? "-ml-2" : ""
                        } hover:z-10 relative transition-transform hover:scale-110`}
                      >
                        <AvatarImage src={member.profile} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{member.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
