import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext"; // Import et

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Okul Yönetim Sistemi",
  description: "Öğretmen ve Veli Uygulaması",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <AuthProvider> {/* Uygulamayı sarmala */}
          <div className="max-w-lg mx-auto bg-gray-50 min-h-screen font-sans">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}