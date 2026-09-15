import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 条目表单含图片上传（单图上限 5MB），留出 multipart 开销
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
