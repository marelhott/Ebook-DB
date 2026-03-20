import type { ReactNode } from 'react';
import Link from 'next/link';

type ShellProps = {
  children: ReactNode;
};

const nav = [
  { href: '/', label: 'Home' },
  { href: '/library', label: 'Library' },
  { href: '/devices', label: 'Devices' },
  { href: '/translations', label: 'Translation' },
  { href: '/import', label: 'Import' },
  { href: '/books/the-name-of-the-rose', label: 'Book' },
  { href: '/authors/author-eco', label: 'Author' },
];

export function Shell({ children }: ShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-row">
          <Link href="/" className="brand">
            Book Universe
          </Link>
          <nav className="nav">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="nav-link">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
