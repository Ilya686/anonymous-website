import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'Anonymous Services - Цифровые услуги',
  description:
    'Профессиональные цифровые услуги с гарантией конфиденциальности и качества',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="manifest.json" crossOrigin="use-credentials" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Anonymous" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="icon" href="icons/favicon.ico" sizes="32x32" />
        <link rel="icon" href="icons/icon-192x192.png" sizes="192x192" />
        <link rel="icon" href="icons/icon-512x512.png" sizes="512x512" />
        <link rel="apple-touch-icon" href="icons/apple-touch-icon.png" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
