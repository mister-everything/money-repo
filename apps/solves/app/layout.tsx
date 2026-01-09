import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { IS_PROD } from "@workspace/util/const";
import { ThemeProvider } from "next-themes";
import { AuthCheck } from "@/components/layouts/auth-check";
import { SwrProvider } from "@/components/swr-provider";
import { Toaster } from "@/components/ui/sonner";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased bg-background`}
      >
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
