import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow OAuth provider profile images
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google
      { protocol: "https", hostname: "ssl.pstatic.net" },          // Naver
      { protocol: "https", hostname: "phinf.pstatic.net" },        // Naver
      { protocol: "https", hostname: "k.kakaocdn.net" },           // Kakao
      { protocol: "https", hostname: "img1.kakaocdn.net" },        // Kakao
    ],
  },
};

export default nextConfig;
