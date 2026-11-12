import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Base site URL. Uses NEXT_PUBLIC_BASE_PATH-aware absolute URLs for SEO.
const SITE_URL = "https://rudra496.github.io/cnc";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: {
    google: ["NE4MzR6NIdQYAoPS52dBxjRxvB8TWUTt4aGM2Uachik", "2h0hS6xG91EuQjYI1FZAHqQHxFmu7l70BmcSz62ZLmc"],
  },
  title: {
    default: "CNC 模拟器 Pro — 免费 3D CNC 铣削与 G-code 模拟器",
    template: "%s · CNC 模拟器 Pro",
  },
  description:
    "免费的浏览器端三轴 CNC 铣削模拟器。随 G-code 运行在 3D 中观看真实材料去除，配备 DRO 控制栏、进给与转速计算器、8 刀具库、26 个示例程序，以及完整 G/M 代码参考手册。100% 客户端运行 — 无需安装。",
  applicationName: "CNC 模拟器 Pro",
  keywords: [
    "CNC 模拟器",
    "在线 CNC 模拟器",
    "G-code 模拟器",
    "G-code",
    "M-code",
    "CNC 铣削",
    "CNC 铣削模拟器",
    "3D 加工",
    "Fanuc",
    "CNC 编程",
    "G-code 可视化",
    "react-three-fiber",
    "Three.js",
    "制造仿真",
    "CAD CAM",
    "学习 CNC",
  ],
  authors: [{ name: "Rudra Sarker", url: "https://github.com/rudra496" }],
  creator: "Rudra Sarker",
  publisher: "Rudra Sarker",
  category: "education",
  icons: {
    icon: [{ url: `${SITE_URL}/favicon.svg`, type: "image/svg+xml" }],
    shortcut: `${SITE_URL}/favicon.svg`,
    apple: `${SITE_URL}/favicon.svg`,
  },
  manifest: `${SITE_URL}/site.webmanifest`,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "CNC 模拟器 Pro — 免费 3D CNC 铣削与 G-code 模拟器",
    description:
      "随 G-code 运行在 3D 中观看真实材料去除。免费浏览器端 CNC 铣削模拟器，配备 DRO 控制栏、进给与转速计算器、刀具库和 26 个示例程序。无需安装 — 100% 客户端运行。",
    url: SITE_URL,
    siteName: "CNC 模拟器 Pro",
    type: "website",
    locale: "zh_CN",
    images: [
      {
        url: `${SITE_URL}/og-image.svg`,
        width: 1280,
        height: 640,
        alt: "CNC 模拟器 Pro — 3D CNC 铣削与 G-code 模拟器",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CNC 模拟器 Pro — 免费 3D CNC 铣削与 G-code 模拟器",
    description:
      "随 G-code 运行在 3D 中观看真实材料去除。免费浏览器端 CNC 模拟器 — 无需安装。",
    images: [`${SITE_URL}/og-image.svg`],
    creator: "@rudra496",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

// JSON-LD structured data for richer search results.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CNC 模拟器 Pro",
  applicationCategory: "EducationalApplication",
  operatingSystem: "任意（网页浏览器）",
  browserRequirements: "需要支持 WebGL 的浏览器",
  description:
    "免费的浏览器端三轴 CNC 铣削模拟器，支持实时 3D 加工、G/M 代码动画、DRO 控制栏、进给与转速计算器、刀具库和 26 个示例程序。",
  url: SITE_URL,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "高保真 3D 龙门立式加工中心与真实材料去除",
    "实时 G-code 动画与当前行跟踪",
    "带主轴、进给与刀具状态的 DRO 控制栏",
    "运行 / 干运行 / 机床锁定 仿真模式",
    "进给与转速计算器（含 MRR 与功率估算）",
    "8 刀具库（立铣刀、钻头、球头刀、倒角刀、面铣刀）",
    "8 材料库及推荐切削参数",
    "26 个可直接运行的示例 G-code 程序",
    "65 条 G/M/T/F/S/Z 代码参考",
    "本地保存、加载、导出与导入程序",
  ],
  author: {
    "@type": "Person",
    name: "Rudra Sarker",
    url: "https://github.com/rudra496",
  },
  license: "https://github.com/rudra496/cnc/blob/main/LICENSE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script defer src="https://analytics.129-159-229-170.sslip.io/script.js" data-website-id="c6afed27-497e-4542-8774-d9aec3c11b61"></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
