// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { CompanyProvider } from '../contexts/CompanyContext';
import SonnerProvider from '../components/providers/SonnerProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Invoice Manager',
  description: 'Manage and validate invoices against QuickBooks data',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CompanyProvider>
            {children}
            <SonnerProvider />
          </CompanyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}