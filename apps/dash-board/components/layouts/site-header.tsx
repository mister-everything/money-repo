"use client";
import { ArrowLeft, MoonIcon, SunIcon } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type Menu = {
  title: string;
  urlPattern: string;
  children?: Menu[];
};

const urls: Menu[] = [
  {
    title: "대시보드",
    urlPattern: "/",
  },
  {
    title: "사용자 관리",
    urlPattern: "/users",
  },
  {
    title: "구독 상품",
    urlPattern: "/solves/plan",
    children: [
      {
        title: "구독 생성",
        urlPattern: "/solves/plan/create",
      },
      {
        title: "구독 수정",
        urlPattern: "/solves/plan/[id]/edit",
      },
    ],
  },
  {
    title: "AI Model 관리",
    urlPattern: "/solves/ai-prices",
  },
];

function findMenuByPattern(
  pattern: string,
  menus: Menu[],
): { parent: Menu | null; current: Menu | null } {
  for (const menu of menus) {
    // 현재 메뉴와 매칭
    if (menu.urlPattern === pattern) {
      return { parent: null, current: menu };
    }

    // 자식 메뉴와 매칭
    if (menu.children) {
      for (const child of menu.children) {
        if (child.urlPattern === pattern) {
          return { parent: menu, current: child };
        }

        // 손자 이하도 재귀적으로 검색
        if (child.children) {
          const result = findMenuByPattern(pattern, [child]);
          if (result.current) {
            return { parent: menu, current: result.current };
          }
        }
      }
    }
  }

  return { parent: null, current: null };
}

function buildBreadcrumbs(parent: Menu | null, current: Menu | null) {
  const breadcrumbs: Menu[] = [];

  if (parent) {
    breadcrumbs.push(parent);
  }

  if (current) {
    breadcrumbs.push(current);
  }

  return breadcrumbs;
}

export function SiteHeader(props: { className?: string }) {
  const { theme = "light", setTheme } = useTheme();
  const pathname = usePathname();
  const params = useParams();

  const { parent, breadcrumbs } = useMemo(() => {
    // params를 [key] 형태로 변환하기 위한 맵 생성
    const inverted = Object.entries(params).reduce(
      (acc, [key, value]) => {
        acc[value as string] = key;
        return acc;
      },
      {} as Record<string, string>,
    );

    // pathname을 pattern으로 변환 (예: /solves/plan/abc123/edit -> /solves/plan/[id]/edit)
    const pattern = pathname
      .split("/")
      .map((segment) => {
        const isDynamicSegment = Object.hasOwn(inverted, segment);
        if (isDynamicSegment) {
          return `[${inverted[segment]}]`;
        }
        return segment;
      })
      .join("/");

    // pattern으로 메뉴 찾기
    const { parent, current } = findMenuByPattern(pattern, urls);

    // breadcrumb 구성
    const breadcrumbs = buildBreadcrumbs(parent, current);

    return { parent, breadcrumbs };
  }, [params, pathname]);

  const hasParent = parent !== null;

  return (
    <header
      className={cn(
        "flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)",
        props.className,
      )}
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {hasParent ? (
          <Link href={parent.urlPattern}>
            <Button variant="ghost" size="icon" className="-ml-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <SidebarTrigger className="-ml-1" />
        )}

        {breadcrumbs.length > 0 ? (
          <>
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((menu, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <div key={menu.urlPattern} className="contents">
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>{menu.title}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link href={menu.urlPattern}>{menu.title}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </div>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </>
        ) : (
          <h1 className="text-base font-medium">Apps</h1>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            variant="ghost"
            size="icon"
            className="hidden sm:flex"
          >
            {theme === "light" ? <SunIcon /> : <MoonIcon />}
          </Button>
        </div>
      </div>
    </header>
  );
}
