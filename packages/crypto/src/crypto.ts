import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export class Crypto {
  private readonly key: Buffer;

  constructor(secret: string) {
    this.key = scryptSync(secret, "salt", KEY_LENGTH);
  }

  /**
   * Encrypt a string and return base64 encoded result
   */
  encode(text: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // [iv (16 bytes)] + [authTag (16 bytes)] + [encrypted data]
    const combined = Buffer.concat([iv, authTag, encrypted]);

    return combined.toString("base64");
  }

  /**
   * Decrypt a base64 encoded string
   */
  decode(encryptedText: string): string {
    const combined = Buffer.from(encryptedText, "base64");

    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  }
}

/**
 * Create a crypto instance with the given secret
 */
export function createCrypto(secret: string): Crypto {
  return new Crypto(secret);
}
