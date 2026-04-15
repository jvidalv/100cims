import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import { ReactNode } from "react";

import "./globals.css";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${bricolageGrotesque.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
