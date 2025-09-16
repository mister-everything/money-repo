import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFbStorage } from "../src/index.js";

const TEST_DIR = path.join(process.cwd(), "temp-test-fb-storage");
const TEST_FILE = path.join(TEST_DIR, "test.json");

describe("createFileBaseStorage", () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it("should save and get FB data", async () => {
    const storage = createFbStorage<{ name: string; age: number }>(TEST_FILE);
    const testData = { name: "John", age: 30 };

    await storage.save(testData);
    const result = await storage.get();

    expect(result).toEqual(testData);
  });

  it("should return null for non-existent file", async () => {
    const storage = createFbStorage(path.join(TEST_DIR, "non-existent.json"));
    const result = await storage.get();

    expect(result).toBeNull();
  });

  it("should delete file", async () => {
    const storage = createFbStorage(TEST_FILE);
    const testData = { test: "data" };

    await storage.save(testData);
    expect(await storage.exists()).toBe(true);

    await storage.delete();
    expect(await storage.exists()).toBe(false);
  });

  it("should check file existence", async () => {
    const storage = createFbStorage(TEST_FILE);

    expect(await storage.exists()).toBe(false);

    await storage.save({ test: "data" });
    expect(await storage.exists()).toBe(true);

    await storage.delete();
    expect(await storage.exists()).toBe(false);
  });

  it("should handle delete on non-existent file gracefully", async () => {
    const storage = createFbStorage(path.join(TEST_DIR, "non-existent.json"));

    await expect(storage.delete()).resolves.toBeUndefined();
  });

  it("should create directory automatically", async () => {
    const nestedFile = path.join(TEST_DIR, "nested", "deep", "test.json");
    const storage = createFbStorage(nestedFile);
    const testData = { nested: "data" };

    await storage.save(testData);
    const result = await storage.get();

    expect(result).toEqual(testData);
  });

  it("should respect custom indent option", async () => {
    const storage = createFbStorage(TEST_FILE, { indent: 4 });
    const testData = { name: "John", age: 30 };

    await storage.save(testData);

    const fileContent = await fs.readFile(TEST_FILE, "utf-8");
    expect(fileContent).toContain('    "name"'); // 4 spaces indent
  });

  it("should handle complex objects", async () => {
    const storage = createFbStorage(TEST_FILE);
    const testData = {
      users: [
        { id: 1, name: "John", metadata: { active: true, tags: ["admin"] } },
        { id: 2, name: "Jane", metadata: { active: false, tags: ["user"] } },
      ],
      config: {
        version: "1.0.0",
        settings: {
          debug: true,
          timeout: 5000,
        },
      },
    };

    await storage.save(testData);
    const result = await storage.get();

    expect(result).toEqual(testData);
  });

  it("should handle array data", async () => {
    const storage = createFbStorage<string[]>(TEST_FILE);
    const testData = ["apple", "banana", "cherry"];

    await storage.save(testData);
    const result = await storage.get();

    expect(result).toEqual(testData);
  });

  it("should handle primitive data", async () => {
    const stringStorage = createFbStorage<string>(TEST_FILE);
    await stringStorage.save("hello world");
    expect(await stringStorage.get()).toBe("hello world");

    const numberStorage = createFbStorage<number>(TEST_FILE);
    await numberStorage.save(42);
    expect(await numberStorage.get()).toBe(42);

    const booleanStorage = createFbStorage<boolean>(TEST_FILE);
    await booleanStorage.save(true);
    expect(await booleanStorage.get()).toBe(true);
  });
});
