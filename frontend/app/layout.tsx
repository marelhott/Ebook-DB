import type { ReactNode } from 'react';
import { Shell } from '../components/shell';
import './globals.css';

export const metadata = {
  title: 'Book Universe',
  description: 'A premium home for the books you own, read, and discover.',
};

type LayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
