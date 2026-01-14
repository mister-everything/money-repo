import { workBooksTable } from "@service/solves";
import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  or,
  sql,
} from "drizzle-orm";
import z from "zod";
import { pgDb } from "./db";
import { contentReportsTable } from "./schema";
import { createReportSchema, ReportCategoryMain, ReportStatus } from "./types";

export const reportService = {
  //사용자가 문제를 신고
  async createReport(input: z.infer<typeof createReportSchema>) {
    const [inserted] = await pgDb
      .insert(contentReportsTable)
      .values({
        reporterUserId: input.reporterUserId,
        targetType: input.targetType,
        targetId: input.targetId,
        categoryMain: input.categoryMain,
        categoryDetail: input.categoryDetail,
        detailText: input.detailText,
      })
      .onConflictDoUpdate({
        target: [
          contentReportsTable.reporterUserId,
          contentReportsTable.targetType,
          contentReportsTable.targetId,
          contentReportsTable.categoryDetail,
        ],
        set: {
          detailText: input.detailText,
        },
      })
      .returning();

    return inserted;
  },

  /**
   * 신고 목록/통계 조회 (대시보드용)
   * - 우선 검토 기준: 동일 target_type + target_id에 대한 고유 신고자 5인 이상
   * - 우선 검토/집계/필터는 처리 완료(RESOLVED/REJECTED) 건을 제외
   * - 검색: 대상 ID, 상세 내용, 신고자/대상 소유자 이름+이메일, 카테고리, 운영 메모
   */
  async listReportsWithPagination({
    page = 1,
    limit = 10,
    categoryMain,
    status,
    search,
    priorityOnly = false,
  }: {
    page?: number;
    limit?: number;
    categoryMain?: ReportCategoryMain;
    status?: ReportStatus;
    search?: string;
    priorityOnly?: boolean;
  }) {
    const offset = (page - 1) * limit;

    /**
     * 우선 검토 대상 식별을 위한 서브쿼리
     *
     * 동일한 콘텐츠(워크북/블록)에 대해 몇 명의 고유한 사용자가 신고했는지 집계합니다.
     * 예: 워크북 A에 대해 사용자 1,2,3이 각각 신고 → reporterCount = 3
     *
     * 이 카운트가 5 이상이면 "우선 검토" 대상으로 분류됩니다.
     * (많은 사람이 문제를 제기한 콘텐츠 = 심각도가 높을 가능성)
     */
    const priorityCounts = pgDb
      .select({
        targetType: contentReportsTable.targetType,
        targetId: contentReportsTable.targetId,
        reporterCount: countDistinct(contentReportsTable.reporterUserId).as(
          "reporter_count",
        ),
      })
      .from(contentReportsTable)
      .groupBy(contentReportsTable.targetType, contentReportsTable.targetId)
      .as("priority_counts");

    /**
     * WHERE 조건 구성
     *
     * 사용자가 선택한 필터 옵션에 따라 동적으로 WHERE 절을 구성합니다.
     */
    const where: any[] = [];

    // 카테고리 필터 (예: 오류, 위반 등)
    if (categoryMain) {
      where.push(eq(contentReportsTable.categoryMain, categoryMain));
    }

    // 상태 필터 (예: 접수됨, 검토중, 해결됨 등)
    if (status) {
      where.push(eq(contentReportsTable.status, status));
    }

    /**
     * 통합 검색 기능
     *
     * 검색어가 다음 필드들 중 하나라도 포함되면 결과에 포함됩니다:
     * - 신고 내용 (detailText): 사용자가 작성한 신고 상세 내용
     * - 카테고리 상세 (categoryDetail): 신고 세부 분류
     * - 처리 메모 (processingNote): 운영자가 작성한 처리 내용
     * - 신고 문제집 제목 (workBooksTable.title): 신고된 콘텐츠의 제목
     *
     * ilike를 사용하여 대소문자 구분 없이 부분 일치 검색을 수행합니다.
     */
    if (search && search.trim()) {
      const pattern = `%${search.trim()}%`;
      where.push(
        or(
          ilike(contentReportsTable.detailText, pattern),
          ilike(contentReportsTable.categoryDetail, pattern),
          ilike(contentReportsTable.processingNote, pattern),
          ilike(workBooksTable.title, pattern),
        ),
      );
    }

    /**
     * 미처리 상태 정의
     *
     * RECEIVED(접수됨)와 IN_REVIEW(검토중)는 아직 처리가 완료되지 않은 상태입니다.
     * 우선 검토 대상 집계 시 이 상태들만 카운트합니다.
     */
    const pendingStatuses: ReportStatus[] = [
      ReportStatus.RECEIVED,
      ReportStatus.IN_REVIEW,
    ];

    /**
     * 우선 검토 필터
     *
     * priorityOnly가 true일 때:
     * - 5명 이상의 고유 신고자가 있고 (gte(reporterCount, 5))
     * - 아직 처리되지 않은 (pendingStatuses) 신고만 조회
     *
     * 이는 긴급하게 처리해야 할 신고를 빠르게 파악하기 위한 필터입니다.
     */
    if (priorityOnly) {
      where.push(
        and(
          gte(priorityCounts.reporterCount, 5),
          inArray(contentReportsTable.status, pendingStatuses),
        ),
      );
    }

    /**
     * 메인 쿼리 - SELECT 절
     *
     * reporterCount:
     * priorityCounts 서브쿼리에서 계산된 동일 대상에 대한 총 신고자 수
     * (이 값이 5 이상이면 우선 검토 대상)
     */
    const baseQuery = pgDb
      .select({
        // 신고 기본 정보
        id: contentReportsTable.id,
        reportedAt: contentReportsTable.reportedAt,

        // 신고 대상 정보
        targetType: contentReportsTable.targetType,
        targetId: contentReportsTable.targetId,

        // 신고 대상 소유자 ID (공개 상태 토글에 필요)
        targetOwnerId: workBooksTable.ownerId,

        // 신고 문제집 제목
        targetTitle: workBooksTable.title,

        // 신고 대상(문제집) 공개 상태
        targetIsPublic: workBooksTable.isPublic,

        // 신고 분류 및 내용
        categoryMain: contentReportsTable.categoryMain,
        categoryDetail: contentReportsTable.categoryDetail,
        detailText: contentReportsTable.detailText,

        // 처리 상태 및 정보
        status: contentReportsTable.status,
        processedAt: contentReportsTable.processedAt,
        processingNote: contentReportsTable.processingNote,

        // 우선순위 판단을 위한 동일 대상 신고자 수
        reporterCount: sql<number>`coalesce(${priorityCounts.reporterCount}, 0)`,
      })
      .from(contentReportsTable)
      /**
       * JOIN 1: priorityCounts (신고자 수 집계)
       *
       * 동일한 대상(targetType + targetId)에 대한 고유 신고자 수를 가져옵니다.
       * LEFT JOIN을 사용하여 집계 데이터가 없어도 신고 자체는 조회되도록 합니다.
       */
      .leftJoin(
        priorityCounts,
        and(
          eq(priorityCounts.targetType, contentReportsTable.targetType),
          eq(priorityCounts.targetId, contentReportsTable.targetId),
        ),
      )
      /**
       * JOIN 2: workBooksTable (워크북 정보)
       *
       * 타입 캐스팅 이유:
       * - contentReportsTable.targetId는 TEXT 타입
       * - workBooksTable.id는 UUID 타입
       * - PostgreSQL에서 TEXT와 UUID를 비교하려면 명시적 캐스팅 필요
       */
      .leftJoin(
        workBooksTable,
        eq(
          contentReportsTable.targetId,
          sql<string>`${workBooksTable.id}::text`,
        ),
      );

    /**
     * WHERE 절 적용
     *
     * 앞서 구성한 필터 조건들을 AND로 결합합니다.
     * 조건이 없으면 undefined를 반환하여 전체 조회가 가능하도록 합니다.
     */
    const whereClause = where.length ? and(...where) : undefined;

    const dataQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;

    /**
     * 페이지네이션된 신고 목록 조회
     *
     * - 최신 신고가 먼저 보이도록 reportedAt 기준 내림차순 정렬
     * - limit: 한 페이지에 표시할 개수
     * - offset: 건너뛸 개수 (이전 페이지들의 데이터)
     */
    const reports = await dataQuery
      .orderBy(desc(contentReportsTable.reportedAt))
      .limit(limit)
      .offset(offset);

    /**
     * 전체 개수 조회 쿼리
     *
     * 페이지네이션 UI 구성을 위해 필터 조건에 맞는 전체 신고 건수를 계산합니다.
     *
     * 주의: 메인 쿼리와 동일한 JOIN 구조를 유지해야 합니다.
     * 이유는 search 필터가 JOIN된 테이블의 컬럼(신고 문제집 제목 등)을 참조하기 때문입니다.
     */
    const countQuery = pgDb
      .select({ value: count() })
      .from(contentReportsTable)
      .leftJoin(
        priorityCounts,
        and(
          eq(priorityCounts.targetType, contentReportsTable.targetType),
          eq(priorityCounts.targetId, contentReportsTable.targetId),
        ),
      )
      .leftJoin(
        workBooksTable,
        eq(
          contentReportsTable.targetId,
          sql<string>`${workBooksTable.id}::text`,
        ),
      );

    const [{ value: totalCount }] = await (whereClause
      ? countQuery.where(whereClause)
      : countQuery);

    // 전체 페이지 수 계산 (올림 처리)
    const totalPages = Math.ceil(totalCount / limit);

    /**
     * 통계 데이터 수집
     *
     * 대시보드 상단에 표시할 집계 정보를 계산합니다.
     * 주의: 이 통계들은 사용자가 선택한 필터와 무관하게 전체 데이터 기준으로 계산됩니다.
     * (필터는 목록 조회에만 적용되고, 통계는 항상 전체 현황을 보여줌)
     */

    /**
     * 1. 우선 검토 대상 개수
     *
     * 조건:
     * - 동일 대상에 대해 5명 이상이 신고했고
     * - 아직 처리되지 않은 (RECEIVED 또는 IN_REVIEW) 상태
     *
     * 이 숫자가 높으면 긴급하게 처리해야 할 신고가 많다는 의미입니다.
     */
    const [{ value: priorityCount }] = await pgDb
      .select({ value: count() })
      .from(contentReportsTable)
      .leftJoin(
        priorityCounts,
        and(
          eq(priorityCounts.targetType, contentReportsTable.targetType),
          eq(priorityCounts.targetId, contentReportsTable.targetId),
        ),
      )
      .where(
        and(
          gte(priorityCounts.reporterCount, 5),
          inArray(
            contentReportsTable.status,
            pendingStatuses as unknown as ReportStatus[],
          ),
        ),
      );

    /**
     * 2. 미처리 신고 개수
     *
     * 접수됨(RECEIVED) + 검토중(IN_REVIEW) 상태의 모든 신고
     * 운영팀이 처리해야 할 전체 작업량을 나타냅니다.
     */
    const [{ value: pendingCount }] = await pgDb
      .select({ value: count() })
      .from(contentReportsTable)
      .where(inArray(contentReportsTable.status, pendingStatuses));

    /**
     * 3. 오류 카테고리 신고 개수
     *
     * 콘텐츠의 기술적 문제(오타, 정답 오류, 해설 오류 등)에 대한 신고
     * 이 숫자가 높으면 콘텐츠 품질 개선이 필요합니다.
     */
    const [{ value: errorCount }] = await pgDb
      .select({ value: count() })
      .from(contentReportsTable)
      .where(eq(contentReportsTable.categoryMain, ReportCategoryMain.ERROR));

    /**
     * 4. 위반 카테고리 신고 개수
     *
     * 부적절한 콘텐츠(스팸, 저작권 침해, 유해 콘텐츠 등)에 대한 신고
     * 이 숫자가 높으면 콘텐츠 모더레이션 강화가 필요합니다.
     */
    const [{ value: violationCount }] = await pgDb
      .select({ value: count() })
      .from(contentReportsTable)
      .where(
        eq(contentReportsTable.categoryMain, ReportCategoryMain.VIOLATION),
      );

    /**
     * 5. 기타 카테고리 신고 개수
     *
     * ERROR나 VIOLATION에 해당하지 않는 기타 신고들
     * (예: 개선 제안, 기타 문의 등)
     */
    const [{ value: otherCount }] = await pgDb
      .select({ value: count() })
      .from(contentReportsTable)
      .where(eq(contentReportsTable.categoryMain, ReportCategoryMain.OTHER));

    /**
     * 최종 반환 데이터
     *
     * - reports: 현재 페이지의 신고 목록 (필터 적용됨)
     * - totalCount, totalPages, page, limit: 페이지네이션 정보 (필터 적용됨)
     * - stats: 전체 통계 (필터와 무관한 전체 현황)
     */
    return {
      reports,
      totalCount,
      totalPages,
      page,
      limit,
      stats: {
        priorityCount,
        pendingCount,
        errorCount,
        violationCount,
        otherCount,
      },
    };
  },

  /**
   * 신고 상세 조회
   */
  async getReportById(reportId: string) {
    const priorityCounts = pgDb
      .select({
        targetType: contentReportsTable.targetType,
        targetId: contentReportsTable.targetId,
        reporterCount: countDistinct(contentReportsTable.reporterUserId).as(
          "reporter_count",
        ),
      })
      .from(contentReportsTable)
      .groupBy(contentReportsTable.targetType, contentReportsTable.targetId)
      .as("priority_counts");

    const [report] = await pgDb
      .select({
        id: contentReportsTable.id,
        reportedAt: contentReportsTable.reportedAt,

        targetType: contentReportsTable.targetType,
        targetId: contentReportsTable.targetId,

        targetOwnerId: workBooksTable.ownerId,
        targetTitle: workBooksTable.title,
        targetIsPublic: workBooksTable.isPublic,

        categoryMain: contentReportsTable.categoryMain,
        categoryDetail: contentReportsTable.categoryDetail,
        detailText: contentReportsTable.detailText,

        status: contentReportsTable.status,
        processedAt: contentReportsTable.processedAt,
        processingNote: contentReportsTable.processingNote,

        reporterCount: sql<number>`coalesce(${priorityCounts.reporterCount}, 0)`,
      })
      .from(contentReportsTable)
      .leftJoin(
        priorityCounts,
        and(
          eq(priorityCounts.targetType, contentReportsTable.targetType),
          eq(priorityCounts.targetId, contentReportsTable.targetId),
        ),
      )
      .leftJoin(
        workBooksTable,
        eq(
          contentReportsTable.targetId,
          sql<string>`${workBooksTable.id}::text`,
        ),
      )
      .where(eq(contentReportsTable.id, reportId));

    return report;
  },

  /**
   * 신고 상태 업데이트
   */
  async updateReportStatus({
    reportId,
    status,
    processorUserId,
    processingNote,
  }: {
    reportId: string;
    status: ReportStatus;
    processorUserId: string;
    processingNote?: string;
  }) {
    const [updated] = await pgDb
      .update(contentReportsTable)
      .set({
        status,
        processorUserId,
        processedAt: new Date(),
        processingNote: processingNote ?? null,
      })
      .where(eq(contentReportsTable.id, reportId))
      .returning();

    return updated;
  },
};
