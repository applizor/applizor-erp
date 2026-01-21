import type { Metadata } from 'next'
import './globals.css'
import { AlertProvider } from '@/context/AlertContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { ConfirmationProvider } from '@/context/ConfirmationContext'

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
              {children}
            </ConfirmationProvider>
          </AlertProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
