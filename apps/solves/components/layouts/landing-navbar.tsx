"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

import { ThemeToggle } from "../theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Skeleton } from "../ui/skeleton";

const navLinks: { name: string; href: string }[] = [];

function UserMenu() {
  const { data, isPending, isRefetching } = authClient.useSession();

  const isAnonymous = useMemo(() => {
    return !isPending && !data && !isRefetching;
  }, [data, isPending, isRefetching]);

  const displayName = useMemo(() => {
    if (!data?.user) return "";
    return (data.user as any).nickname ?? data.user.name ?? "";
  }, [data]);

  if (isPending) {
    return <Skeleton className="size-9 rounded-full" />;
  }

  if (isAnonymous) {
    return (
      <Link href="/sign-in?callbackUrl=/workbooks">
        <Button variant="ghost" className="rounded-full font-medium">
          로그인
        </Button>
      </Link>
    );
  }

  return (
    <Link href={"/workbooks"}>
      <Avatar className="size-10 flex items-center justify-center bg-secondary overflow-visible relative">
        <Avatar className="absolute size-10 flex items-center fade-5000 justify-center bg-secondary blur-2xl -z-10">
          <AvatarImage
            src={data?.user.image ?? ""}
            fetchPriority="low"
            alt={`${displayName} 프로필 이미지`}
            className="object-cover size-7 rounded-full"
          />
        </Avatar>
        <AvatarImage
          fetchPriority="high"
          src={data?.user.image ?? ""}
          alt={`${displayName} 프로필 이미지`}
          className="object-cover size-7 rounded-full"
        />
        <AvatarFallback className="text-4xl">
          {displayName?.charAt(0) || "?"}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}

export function LandingNavbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const shouldBeScrolled = latest > 50;
    if (shouldBeScrolled !== isScrolled) {
      setIsScrolled(shouldBeScrolled);
    }
  });

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.nav
        className={cn(
          "flex items-center justify-between px-6 py-3 rounded-full transition-all duration-300 w-full max-w-5xl",
          isScrolled
            ? "bg-secondary backdrop-blur-md dark:bg-secondary/40"
            : "bg-transparent",
        )}
        layout
      >
        <span className="font-bold text-xl tracking-tight logo-text">
          Solves
          <span className="text-primary group-hover:scale-110 inline-block transition-transform duration-300">
            .
          </span>
        </span>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/50 px-3 py-1.5 rounded-full"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <UserMenu />
          <ThemeToggle className="rounded-full" variant="outline" />
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="rounded-b-4xl pt-16">
              <div className="flex flex-col items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-lg font-medium"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="flex flex-col gap-3 w-full max-w-xs mt-4 items-center">
                  <UserMenu />
                </div>
                <ThemeToggle className="rounded-full" variant="outline" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.nav>
    </motion.header>
  );
}
