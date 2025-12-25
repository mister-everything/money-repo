import { describe, expect, it } from "vitest";
import { Crypto, createCrypto } from "./crypto";

describe("Crypto", () => {
  const secret = "my-super-secret-key";

  it("should encrypt and decrypt a string", () => {
    const crypto = new Crypto(secret);
    const original = "Hello, World!";

    const encrypted = crypto.encode(original);
    const decrypted = crypto.decode(encrypted);

    expect(decrypted).toBe(original);
    expect(encrypted).not.toBe(original);
  });

  it("should handle empty string", () => {
    const crypto = createCrypto(secret);

    const encrypted = crypto.encode("");
    const decrypted = crypto.decode(encrypted);

    expect(decrypted).toBe("");
  });

  it("should handle unicode characters", () => {
    const crypto = createCrypto(secret);
    const original = "안녕하세요! 🎉 こんにちは";

    const encrypted = crypto.encode(original);
    const decrypted = crypto.decode(encrypted);

    expect(decrypted).toBe(original);
  });

  it("should handle long text", () => {
    const crypto = createCrypto(secret);
    const original = "Lorem ipsum ".repeat(1000);

    const encrypted = crypto.encode(original);
    const decrypted = crypto.decode(encrypted);

    expect(decrypted).toBe(original);
  });

  it("should produce different ciphertext for same plaintext", () => {
    const crypto = createCrypto(secret);
    const original = "Hello, World!";

    const encrypted1 = crypto.encode(original);
    const encrypted2 = crypto.encode(original);

    expect(encrypted1).not.toBe(encrypted2);
  });

  it("should fail with wrong secret", () => {
    const crypto1 = createCrypto(secret);
    const crypto2 = createCrypto("wrong-secret");

    const encrypted = crypto1.encode("Hello");

    expect(() => crypto2.decode(encrypted)).toThrow();
  });

  it("should create instance with createCrypto helper", () => {
    const crypto = createCrypto(secret);
    expect(crypto).toBeInstanceOf(Crypto);
  });
});
