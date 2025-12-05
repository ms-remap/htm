import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/AuthContext'
import '@/index.css'

export const metadata: Metadata = {
  title: 'Email Outreach Platform',
  description: 'Manage your email campaigns and outreach',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
