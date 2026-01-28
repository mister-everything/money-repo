import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { IS_PROD } from "@workspace/util/const";
import { ThemeProvider } from "next-themes";
import { AuthCheck } from "@/components/layouts/auth-check";
import { SwrProvider } from "@/components/swr-provider";
import { Toaster } from "@/components/ui/sonner";
import { BASE_URL } from "@/lib/const";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "Solves - AI와 함께 만드는 나만의 문제집",
    template: "%s | Solves",
  },
  description:
    "호기심이 문제가 되는 순간, Solves. AI와 함께 만드는 나만의 지식 놀이터. 상상하던 모든 것을 문제집으로 만들어보세요.",
  keywords: ["AI", "문제집", "퀴즈", "학습", "교육", "Solves"],
  authors: [{ name: "Solves" }],
  openGraph: {
    type: "website",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Solves - AI와 함께 만드는 나만의 문제집",
      },
    ],
    locale: "ko_KR",
    url: BASE_URL,
    siteName: "Solves",
    title: "Solves - AI와 함께 만드는 나만의 문제집",
    description:
      "호기심이 문제가 되는 순간, Solves. AI와 함께 만드는 나만의 지식 놀이터.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solves - AI와 함께 만드는 나만의 문제집",
    description:
      "호기심이 문제가 되는 순간, Solves. AI와 함께 만드는 나만의 지식 놀이터.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-M8TZJSJS');
            `,
          }}
        />
      </head>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased bg-background`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-M8TZJSJS"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          themes={["light", "dark"]}
          disableTransitionOnChange
        >
          <Toaster />
          <SwrProvider>
            <div id="root">{children}</div>
            {!IS_PROD && <AuthCheck />}
          </SwrProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
