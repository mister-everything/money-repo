"use client";

import { Menu, Monitor } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function ProbCreateHeader() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-white/10">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          className="bg-black/50 border-white/30 text-white hover:bg-white/10"
        >
          <Menu className="w-4 h-4" />
        </Button>
        <h1 className="text-white text-xl font-bold">AI Problem Generator</h1>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          className="bg-black/50 border-white/30 text-white hover:bg-white/10"
        >
          <Monitor className="w-4 h-4" />
        </Button>
        <Avatar className="border size-8">
          <AvatarImage src={"/images/avatar.png"} />
          <AvatarFallback>{"A"}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
