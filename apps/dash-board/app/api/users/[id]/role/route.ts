import { userService } from "@service/auth";
import { RoleSchema } from "@service/auth/shared";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // RoleSchema를 사용한 역할 유효성 검증
    const role = RoleSchema.parse(body.role);

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
    // Zod 검증 오류 처리
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          error: "유효하지 않은 역할입니다. 'admin' 또는 'user'만 허용됩니다.",
        },
        { status: 400 },
      );
    }

    console.error("사용자 역할 업데이트 실패:", error);
    return NextResponse.json(
      { error: "사용자 역할 업데이트에 실패했습니다." },
      { status: 500 },
    );
  }
}
