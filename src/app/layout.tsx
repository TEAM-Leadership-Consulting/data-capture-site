// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Legal Claims Portal - Professional Claim Filing Services",
  description: "Secure and efficient claim filing portal with professional legal support. File your claim with confidence using our streamlined process.",
  keywords: "legal claims, claim filing, legal services, professional claims portal",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        {/* Fixed Navigation Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg">
          <Navigation />
        </div>
        
        {/* Main Content with responsive top padding for fixed header */}
        <main className="flex-grow pt-16 sm:pt-20 lg:pt-24">
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  );
}