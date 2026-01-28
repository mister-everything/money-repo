import { workBookService } from "@service/solves";
import type { MetadataRoute } from "next";

const BASE_URL = "https://www.solves-ai.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/workbooks`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/workbooks/creator/new`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/sign-in`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 공개된 워크북 (최대 2000개, 최신 업데이트순)
  try {
    const workbooks = await workBookService.searchWorkBooks({
      isPublished: true,
      limit: 2000,
    });

    const workbookPages: MetadataRoute.Sitemap = workbooks.map((wb) => ({
      url: `${BASE_URL}/workbooks/${wb.id}/preview`,
      lastModified: wb.publishedAt ?? wb.createdAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticPages, ...workbookPages];
  } catch (error) {
    // DB 연결 실패 시 정적 페이지만 반환
    console.error("Failed to fetch workbooks for sitemap:", error);
    return staticPages;
  }
}
