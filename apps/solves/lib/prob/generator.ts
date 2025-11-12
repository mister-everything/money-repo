import { fetcher } from "@/lib/fetcher";
import {
  DEFAULT_PROBLEM_COUNT,
  type ProbGenerationRequest,
  type ProbGenerationResponse,
  probGenerationRequestSchema,
  probGenerationResponseSchema,
} from "./schemas";

export { DEFAULT_PROBLEM_COUNT } from "./schemas";

export async function generateProbBook(
  payload: ProbGenerationRequest,
): Promise<ProbGenerationResponse> {
  const parsed = probGenerationRequestSchema.parse(payload);
  const normalizedPayload = {
    ...parsed,
    problemCount: parsed.problemCount ?? DEFAULT_PROBLEM_COUNT,
  };

  console.log("[ProbGeneration] API 요청 전송:", normalizedPayload);

  const response = await fetcher<unknown>("/api/prob/generate", {
    method: "POST",
    body: JSON.stringify(normalizedPayload),
  });

  console.log("[ProbGeneration] API 응답 수신:", response);

  const parsedResponse = probGenerationResponseSchema.parse(response);

  console.log("[ProbGeneration] 응답 파싱 결과:", parsedResponse);

  return parsedResponse;
}
