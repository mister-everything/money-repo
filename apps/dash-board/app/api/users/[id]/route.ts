import { userService } from "@service/auth";
import { NextRequest, NextResponse } from "next/server";
import { log } from "@/lib/logger";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 사용자 ID 유효성 검증
    if (!id) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 },
      );
    }

    // 사용자 삭제
    await userService.deleteUser(id);

    return NextResponse.json({
      success: true,
      message: "사용자가 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    log.error("사용자 삭제 실패:", error);
    return NextResponse.json(
      { error: "사용자 삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}
