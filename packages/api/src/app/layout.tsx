import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ReactNode } from "react";

import "./globals.css";

const GOOGLE_ADS_ID = "AW-18104409988";

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
      <head>
        <link
          rel="preconnect"
          href="https://dg49c3nlr5rbl.cloudfront.net"
          crossOrigin=""
        />
      </head>
      <body
        className={`${bricolageGrotesque.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-ads-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ADS_ID}');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
