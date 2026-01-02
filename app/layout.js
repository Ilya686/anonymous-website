import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'Anonymous Services - Цифровые услуги',
  description:
    'Профессиональные цифровые услуги с гарантией конфиденциальности и качества',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
