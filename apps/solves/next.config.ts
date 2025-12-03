import "@workspace/env";
import { type NextConfig } from "next";

const nextConfig: NextConfig = {
  cleanDistDir: true,
  devIndicators: {
    position: "bottom-right",
  },
  serverExternalPackages: ["shiki", "streamdown"],
  experimental: {
    globalNotFound: true,
  },
};

export default nextConfig;
