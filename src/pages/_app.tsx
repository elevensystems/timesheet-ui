import type { AppProps } from 'next/app';
import { Ubuntu } from 'next/font/google';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import '@/styles/globals.css';

const ubuntu = Ubuntu({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-ubuntu',
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
      <div className={`${ubuntu.variable} font-sans`}>
        <Component {...pageProps} />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
