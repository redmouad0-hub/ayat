import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // إنشاء نسخة ثابتة من الموقع
  output: "export",

  // مسار المشروع على GitHub Pages
  basePath: "/ayat",

  // إنشاء index.html لكل صفحة
  trailingSlash: true,

  // السماح بعرض الصور دون خادم Next.js
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
