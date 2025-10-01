/** @type {import('next').NextConfig} */
const nextConfig = {
  cleanDistDir: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "sample-videos.com" },
    ],
  },
};

export default nextConfig;
