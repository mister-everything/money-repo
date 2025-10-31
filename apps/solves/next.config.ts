import "@workspace/env";
import { type NextConfig } from "next";

const nextConfig: NextConfig = {
  cleanDistDir: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "sample-videos.com" },
    ],
  },
  devIndicators: {
    position: "bottom-right",
  },
  experimental: {
    globalNotFound: true,
  },
};

export default nextConfig;
