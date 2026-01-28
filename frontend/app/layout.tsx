import type { Metadata } from 'next'
import './globals.css'
import { AlertProvider } from '@/context/AlertContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { ConfirmationProvider } from '@/context/ConfirmationContext'
import { SocketProvider } from '@/contexts/SocketContext'

export const metadata: Metadata = {
  title: 'Applizor ERP',
  description: 'Complete ERP/CRM/HRMS Solution',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AlertProvider>
            <ConfirmationProvider>
              <SocketProvider>
                {children}
              </SocketProvider>
            </ConfirmationProvider>
          </AlertProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
