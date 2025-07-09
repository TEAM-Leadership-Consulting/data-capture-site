// app/admin-dashboard-Logix/layout.tsx
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - Claims Portal Management",
  description: "Secure administrative interface for managing the claims portal, content, and user data.",
  robots: "noindex, nofollow",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-section">
      {/* Only keep the robots meta tag */}
      <meta name="robots" content="noindex, nofollow" />
      
      {/* Admin content */}
      {children}
      
      {/* Security script to prevent framing */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Prevent clickjacking
            if (window.top !== window.self) {
              window.top.location = window.self.location;
            }
            
            // Clear console in production
            if (typeof console !== 'undefined' && !window.location.hostname.includes('localhost')) {
              console.clear();
              console.log('%cAdmin Portal', 'color: #2563eb; font-size: 24px; font-weight: bold;');
              console.log('%cUnauthorized access is prohibited and monitored.', 'color: #dc2626; font-size: 14px;');
            }
          `,
        }}
      />
    </div>
  );
}