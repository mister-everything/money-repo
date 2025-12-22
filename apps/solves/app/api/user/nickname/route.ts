import { userService } from "@service/auth/user.service";
import z from "zod";

import { getSession } from "@/lib/auth/server";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

const UpdateNicknameSchema = z.object({
  nickname: z.string(),
});

/**
 * GET /api/user/nickname
 * 현재 사용자의 닉네임 조회
 */
export async function GET() {
  try {
    const session = await getSession();
    const extendedData = await userService.getUserExtendedData(session.user.id);

    return nextOk({
      nickname: extendedData?.nickname ?? null,
    });
  } catch (error) {
    return nextFail(error, 500);
  }
}

/**
 * PUT /api/user/nickname
 * 닉네임 변경
 */
export async function PUT(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { nickname } = UpdateNicknameSchema.parse(body);

    await userService.updateNickname(session.user.id, nickname);

    return nextOk({ success: true });
  } catch (error) {
    return nextFail(error, 400);
  }
}

/**
 * POST /api/user/nickname/generate
 * 랜덤 닉네임 생성 (온보딩 시 사용)
 */
export async function POST() {
  try {
    await getSession(); // 인증 확인
    const nickname = await userService.generateNickname();

    return nextOk({ nickname });
  } catch (error) {
    return nextFail(error, 500);
  }
}

