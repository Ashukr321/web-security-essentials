import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import RegisterSW from "@/components/common/RegisterSW";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_NAME = "Web Security Essentials";
const DESCRIPTION =
  "A practical, interview-ready guide to web security: XSS, CSRF, CORS, HTTPS & HSTS, cookies, supply-chain attacks and backend vulnerabilities — explained clearly.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: `${SITE_NAME} — Web Vulnerabilities & Defenses Explained`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "web security",
    "XSS",
    "CSRF",
    "CORS",
    "HSTS",
    "content security policy",
    "supply chain attacks",
    "SQL injection",
    "OWASP",
    "frontend security interview",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary", title: SITE_NAME, description: DESCRIPTION },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WebSec",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

// Runs before paint so the saved theme never flashes. Dark is the default.
const themeScript = `try{if(localStorage.getItem("theme")!=="light")document.documentElement.classList.add("dark")}catch(e){document.documentElement.classList.add("dark")}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <Script id="theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
