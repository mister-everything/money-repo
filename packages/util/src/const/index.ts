export const IS_PROD = process.env.NODE_ENV === "production";

export const IS_BROWSER = typeof window != "undefined";

export const IS_VERCEL_ENV = process.env.VERCEL === "1";
