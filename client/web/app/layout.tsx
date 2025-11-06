import { Inter } from 'next/font/google';
import { LayoutClient } from '@/components/layout/layout-client';
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <LayoutClient>
          {children}
        </LayoutClient>
      </body>
    </html>
  );
}
