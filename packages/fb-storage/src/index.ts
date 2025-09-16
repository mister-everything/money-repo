import fs from "node:fs/promises";
import path from "node:path";
import { isJson } from "@workspace/util";

export interface FbStorage<T = any> {
  /**
   * 데이터를 파일에 저장합니다.
   * @param data 저장할 데이터
   */
  save(data: T): Promise<void>;

  /**
   * 파일에서 데이터를 읽어옵니다.
   * @returns 파일에서 읽은 데이터 또는 null (파일이 없는 경우)
   */
  get(): Promise<T | null>;

  /**
   * 파일을 삭제합니다.
   */
  delete(): Promise<void>;

  /**
   * 파일이 존재하는지 확인합니다.
   */
  exists(): Promise<boolean>;
}

export interface FbStorageOptions {
  /** JSON.stringify의 space 파라미터 (기본값: 2) */
  indent?: number;
  /** 디렉토리가 없을 때 자동으로 생성할지 여부 (기본값: true) */
  createDir?: boolean;
}

class FileBaseStorage<T = any> implements FbStorage<T> {
  constructor(
    private readonly filePath: string,
    private readonly options: FbStorageOptions = {},
  ) {}

  private get indent(): number {
    return this.options.indent ?? 2;
  }

  private get createDir(): boolean {
    return this.options.createDir ?? true;
  }

  async save(data: T): Promise<void> {
    try {
      if (this.createDir) {
        const dir = path.dirname(this.filePath);
        await fs.mkdir(dir, { recursive: true });
      }

      const jsonData =
        typeof data === "string"
          ? data
          : JSON.stringify(data, null, this.indent);
      await fs.writeFile(this.filePath, jsonData, "utf-8");
    } catch (error) {
      throw new Error(`Failed to save JSON to ${this.filePath}: ${error}`);
    }
  }

  async get(): Promise<T | null> {
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      return isJson(data) ? JSON.parse(data) : (data as T);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return null;
      }
      throw new Error(`Failed to read JSON from ${this.filePath}: ${error}`);
    }
  }

  async delete(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw new Error(`Failed to delete ${this.filePath}: ${error}`);
      }
    }
  }

  async exists(): Promise<boolean> {
    try {
      await fs.access(this.filePath);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 파일 시스템 기반 스토리지를 생성합니다.
 *
 * @param filePath 파일 경로
 * @param options 옵션 설정
 * @returns FbStorage 인스턴스
 *
 * @example
 * ```typescript
 * const storage = createFbStorage('./data.json');
 *
 * // 데이터 저장
 * await storage.save({ name: 'John', age: 30 });
 *
 * // 데이터 읽기
 * const data = await storage.get();
 * console.log(data); // { name: 'John', age: 30 }
 *
 * // 파일 삭제
 * await storage.delete();
 * ```
 */
export function createFbStorage<T = any>(
  filePath: string,
  options?: FbStorageOptions,
): FbStorage<T> {
  return new FileBaseStorage<T>(filePath, options);
}
