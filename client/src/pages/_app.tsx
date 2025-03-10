import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { SocketProvider } from '@/contexts/SocketContext';
import { TraderProvider } from '@/contexts/TraderContext';
import { UserProvider } from '@/contexts/UserContext';

const inter = Inter({ subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={inter.className}>
      <SocketProvider>
        <TraderProvider>
          <UserProvider>
            <Component {...pageProps} />
          </UserProvider>
        </TraderProvider>
      </SocketProvider>
    </main>
  );
}