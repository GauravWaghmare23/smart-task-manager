import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import StoreProvider from "@/store/provider";
import AuthProvider from "@/components/auth/AuthProvider";
import AuthGuard from "@/components/auth/AuthGuard";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Smart Task Manager",
  description: "Task management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StoreProvider>
          <AuthProvider>
            <AuthGuard>
              {children}
            </AuthGuard>

            <Toaster />
          </AuthProvider>
        </StoreProvider>
      </body>
    </html>
  );
}