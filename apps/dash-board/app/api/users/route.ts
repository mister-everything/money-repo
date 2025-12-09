import { userService } from "@service/auth";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const users = await userService.getEnableUsers();
    return NextResponse.json(users);
  } catch (error) {
    logger.error("사용자 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "사용자 목록을 가져오는데 실패했습니다." },
      { status: 500 },
    );
  }
}
