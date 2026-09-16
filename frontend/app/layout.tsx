import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/Toast';
import { SiteLayoutShell } from '@/components/layout/SiteLayoutShell';
import { I18nProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  title: {
    default: 'Hayden Xue Personal Blog | Digital Garden',
    template: '%s | Hayden Xue',
  },
  description: 'Hayden Xue - Personal Blog & Digital Garden. From the East, toward the unknown.',
  keywords: ['Hayden Xue', 'Hayden', 'Blog', 'Digital Garden', 'Java', 'Next.js', 'AI', 'Architecture'],
  authors: [{ name: 'Hayden Xue' }],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/brand/logo-mark.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/brand/logo-mark.svg', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col selection:bg-emerald-500/20 selection:text-emerald-500">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <I18nProvider initialLocale="zh">
            <SiteLayoutShell>
              {children}
            </SiteLayoutShell>
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
