import "@workspace/env";
import { eq } from "drizzle-orm";
import { pgDb } from "../db";
import { probBooksTable } from "../schema";

async function checkDB() {
  console.log("🔍 직접 DB 조회...");

  try {
    // 모든 문제집 조회
    const allBooks = await pgDb.select().from(probBooksTable);
    console.log("📋 전체 문제집 개수:", allBooks.length);

    if (allBooks.length > 0) {
      console.log("📋 최근 문제집들:");
      allBooks.slice(-3).forEach((book, idx) => {
        console.log(`  ${idx + 1}. ${book.id} - ${book.title}`);
      });

      // 특정 문제집의 문제들 조회
      const lastBook = allBooks[allBooks.length - 1];
      console.log("🔍 마지막 문제집 ID로 직접 조회:", lastBook.id);

      // probService.findById 대신 직접 조회
      const directResult = await pgDb
        .select()
        .from(probBooksTable)
        .where(eq(probBooksTable.id, lastBook.id));

      console.log(
        "📋 직접 조회 결과:",
        directResult.length > 0 ? "찾음" : "없음",
      );
      if (directResult.length > 0) {
        console.log("📋 조회된 데이터:", directResult[0]);
      }
    }
  } catch (error) {
    console.error("❌ DB 조회 에러:", error);
  }
}

checkDB().then(() => process.exit(0));
