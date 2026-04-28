import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DAPS | Digital Asset Protection System",
  description: "Secure and monitor your official sports media assets with GuardVision AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
      style={{ colorScheme: 'dark' }}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --font-inter: ${inter.style.fontFamily};
            --font-outfit: ${outfit.style.fontFamily};
          }
        `}} />
      </head>
      <body className="min-h-full flex flex-col font-inter bg-slate-950 text-slate-50">
        {children}
      </body>
    </html>
  );
}
