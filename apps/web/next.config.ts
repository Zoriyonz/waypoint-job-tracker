import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@waypoint/ai", "@waypoint/match-engine"],
  reactStrictMode: true,
};

export default config;
