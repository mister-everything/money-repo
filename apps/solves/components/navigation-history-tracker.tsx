"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const HISTORY_KEY = "app_nav_history";

export function getAppHistory(): string[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    return JSON.parse(sessionStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function canGoBackInApp(): boolean {
  return getAppHistory().length > 1;
}

export function popAppHistory(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const history = getAppHistory();
  if (history.length > 1) {
    history.pop(); // 현재 페이지 제거
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return history[history.length - 1] ?? null; // 이전 페이지
  }
  return null;
}

/**
 * 앱 내 네비게이션 히스토리를 추적하는 컴포넌트
 * root layout에서 한 번만 렌더링되어야 함
 */
export function NavigationHistoryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const history = getAppHistory();
    const lastPath = history[history.length - 1];

    // 같은 경로면 추가하지 않음
    if (lastPath === pathname) return;

    // 뒤로가기로 온 경우 (이전 히스토리에 현재 경로가 있으면) 처리
    // 하지만 sessionStorage 기반이라 브라우저 뒤로가기는 감지 어려움
    // 그래서 단순히 push만 함
    history.push(pathname);

    // 히스토리 최대 50개로 제한
    if (history.length > 50) {
      history.shift();
    }

    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [pathname]);

  return null;
}
