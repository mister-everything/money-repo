import pg from "pg";

const { Pool } = pg;

// 환경변수 직접 설정 (IPv4 명시)
process.env.POSTGRES_URL =
  "postgresql://jonow:password@127.0.0.1:5432/problem_service_db";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function testConnection() {
  try {
    const client = await pool.connect();

    console.log("✅ 연결 성공");
    console.log("🔗 연결 문자열:", process.env.POSTGRES_URL);

    // 현재 연결 정보 확인
    const connInfo = await client.query(`
      SELECT 
        current_database() as database,
        current_user as user,
        inet_server_addr() as server_addr,
        inet_server_port() as server_port
    `);
    console.log("📀 연결 정보:", connInfo.rows[0]);

    // 스키마 목록 확인
    const schemaResult = await client.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'solves'",
    );
    console.log(
      "📁 solves 스키마 존재:",
      schemaResult.rows.length > 0 ? "✅" : "❌",
    );

    // 테이블 목록 확인 (pg_tables 사용)
    const tableResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'solves'
    `);
    console.log(
      "📋 solves 스키마의 테이블들 (pg_tables):",
      tableResult.rows.map((row) => row.tablename),
    );

    // information_schema로도 확인
    const infoSchemaResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'solves'
    `);
    console.log(
      "📋 solves 스키마의 테이블들 (information_schema):",
      infoSchemaResult.rows.map((row) => row.table_name),
    );

    // search_path 확인
    const searchPathResult = await client.query("SHOW search_path");
    console.log("🔍 Search Path:", searchPathResult.rows[0].search_path);

    // 권한 확인
    const privilegesResult = await client.query(`
      SELECT grantee, privilege_type 
      FROM information_schema.table_privileges 
      WHERE table_schema = 'solves' AND table_name = 'prob_books'
    `);
    console.log("🔒 prob_books 테이블 권한:", privilegesResult.rows);

    try {
      // 직접 쿼리 테스트
      const directQuery = await client.query(
        "SELECT * FROM solves.prob_books LIMIT 1",
      );
      console.log("✅ 직접 쿼리 성공:", directQuery.rows);
    } catch (queryError) {
      console.error("❌ 직접 쿼리 실패:", queryError.message);

      // 다른 방법으로 시도
      try {
        await client.query("SET search_path TO solves, public");
        const query2 = await client.query("SELECT * FROM prob_books LIMIT 1");
        console.log("✅ search_path 설정 후 쿼리 성공:", query2.rows);
      } catch (query2Error) {
        console.error("❌ search_path 설정 후에도 실패:", query2Error.message);
      }
    }

    client.release();
  } catch (error) {
    console.error("❌ 연결 실패:", error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
