import { userService } from "@service/auth/user.service";

import { getSession } from "@/lib/auth/server";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

/**
 * DELETE /api/user/delete-account
 * 계정 삭제 요청 (익명화 처리)
 */
export async function DELETE() {
  try {
    const session = await getSession();

    await userService.anonymizeUser(session.user.id);

    return nextOk({
      success: true,
      message: "계정이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    return nextFail(error, 500);
  }
}

