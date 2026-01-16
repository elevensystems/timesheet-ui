import type { Metadata } from 'next';
import { Ubuntu } from 'next/font/google';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import '@/styles/globals.css';

const ubuntu = Ubuntu({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-ubuntu',
});

export const metadata: Metadata = {
  title: 'Project Worklog',
  description: 'Track your project work log',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${ubuntu.variable} font-sans antialiased`}>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          {children}
          <Toaster position='top-center' />
        </ThemeProvider>
      </body>
    </html>
  );
}
