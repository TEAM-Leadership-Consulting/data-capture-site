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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        {/* Fixed Navigation Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg">
          <Navigation />
        </div>
        
        {/* Main Content with top padding to account for fixed header */}
        <main className="flex-grow">
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  );
}