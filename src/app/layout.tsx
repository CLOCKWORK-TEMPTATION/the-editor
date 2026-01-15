import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "محرر السيناريو العربي",
  description: "محرر سيناريو متقدم للكتابة العربية",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}