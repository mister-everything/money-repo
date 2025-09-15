import { createFsJsonStorage } from "./src/index.js";

// 사용 예시
async function example() {
  // 기본 사용법
  const storage = createFsJsonStorage("./data.json");

  // 데이터 저장
  await storage.save({ name: "John", age: 30, active: true });

  // 데이터 읽기
  const data = await storage.get();
  console.log("Loaded data:", data);

  // 파일 존재 확인
  const exists = await storage.exists();
  console.log("File exists:", exists);

  // 파일 삭제
  await storage.delete();

  // 타입 지정 사용
  interface User {
    id: number;
    name: string;
    email: string;
  }

  const userStorage = createFsJsonStorage<User>("./user.json");
  await userStorage.save({
    id: 1,
    name: "Jane Doe",
    email: "jane@example.com",
  });

  // 배열 데이터
  const listStorage = createFsJsonStorage<string[]>("./list.json");
  await listStorage.save(["apple", "banana", "cherry"]);

  // 옵션 사용
  const configStorage = createFsJsonStorage("./config.json", {
    indent: 4, // 4칸 들여쓰기
    createDir: true, // 디렉토리 자동 생성
  });

  await configStorage.save({
    version: "1.0.0",
    features: {
      authentication: true,
      analytics: false,
    },
  });
}

// 실행 (예시용)
// example().catch(console.error);
