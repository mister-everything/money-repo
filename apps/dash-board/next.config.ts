import "@workspace/env";
import { type NextConfig } from "next";

const nextConfig: NextConfig = {
  cleanDistDir: true,
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
