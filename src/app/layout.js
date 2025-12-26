import './globals.css';
import AdminEditModal from '@/components/AdminEditModal';
import Toast from '@/components/Toast';

export const metadata = {
  title: 'PK Automations - Electronics, Services & Solutions',
  description: 'Leading provider of electronics components, DIY kits, electrical services, biomedical equipment, and web development',
  keywords: 'electronics, Arduino, IoT, automation, web development, biomedical',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        {/* Admin inline edit modal (client component) */}
        <AdminEditModal />
        {/* Toast notifications */}
        <Toast />
      </body>
    </html>
  );
}
