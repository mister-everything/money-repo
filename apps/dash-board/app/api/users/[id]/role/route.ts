import { userService } from "@service/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { role } = body;

    // 역할 유효성 검증
    if (!role || !["admin", "user"].includes(role)) {
      return NextResponse.json(
        {
          error: "유효하지 않은 역할입니다. 'admin' 또는 'user'만 허용됩니다.",
        },
        { status: 400 },
      );
    }

    // 사용자 ID 유효성 검증
    if (!id) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다." },
        { status: 400 },
      );
    }

    // 사용자 역할 업데이트
    await userService.updateUserRole(id, role);

    return NextResponse.json({
      success: true,
      message: "사용자 역할이 성공적으로 업데이트되었습니다.",
    });
  } catch (error) {
    console.error("사용자 역할 업데이트 실패:", error);
    return NextResponse.json(
      { error: "사용자 역할 업데이트에 실패했습니다." },
      { status: 500 },
    );
  }
}
