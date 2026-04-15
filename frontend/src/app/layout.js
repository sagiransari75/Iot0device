import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CursorEffect from '@/components/CursorEffect';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'IotSimX — Web-Based IoT Simulator',
  description: 'Learn Raspberry Pi and IoT sensor connections virtually. No hardware needed.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          <CursorEffect />
          <div className="page-wrap">
            <Navbar />
            <main style={{ flex: 1 }}>{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
