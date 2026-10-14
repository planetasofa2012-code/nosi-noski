import type { NextConfig } from "next";

// DEMO=1 — статичная демо-сборка для GitHub Pages (без сервера: заказы и остатки не работают)
const demo = process.env.DEMO === "1";
const basePath = demo ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "") : "";

const nextConfig: NextConfig = {
  // PPR несовместим со статичной выгрузкой — в демо оставляем только 'use cache'
  cacheComponents: !demo,
  partialPrefetching: !demo,
  ...(demo && { experimental: { useCache: true } }),
  // Серверные API лежат в файлах route.server.ts — в демо-сборку они не попадают
  pageExtensions: demo ? ["tsx", "ts"] : ["tsx", "ts", "server.ts"],
  ...(demo && {
    output: "export",
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
  }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
