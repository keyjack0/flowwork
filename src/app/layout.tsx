import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Flowwork - Manajemen Bisnis',
  description: 'Aplikasi manajemen bisnis terintegrasi: POS, Stok, Keuangan, dan Analytics',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  themeColor: '#685AFF',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: 'Poppins, sans-serif',
              fontSize: '13px',
              fontWeight: '500',
              borderRadius: '10px',
            },
            success: {
              iconTheme: { primary: '#685AFF', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  )
}
