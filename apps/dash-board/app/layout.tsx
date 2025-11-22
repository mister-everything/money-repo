import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@workspace/env";
import { ThemeProvider } from "next-themes";
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
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          themes={["light", "dark"]}
          disableTransitionOnChange
        >
          <Toaster />
          <main className="flex flex-1 flex-col gap-4" id="root">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
