import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Stay Anchorage | Short-Term Rentals in Anchorage, Alaska',
  description: 'Comfortable furnished apartments for short and extended stays in Anchorage, Alaska. Perfect for business travelers, relocations, and visitors.',
  keywords: 'Anchorage rentals, short-term rental, furnished apartment, Alaska lodging, extended stay Anchorage',
  openGraph: {
    title: 'Stay Anchorage | Short-Term Rentals',
    description: 'Comfortable furnished apartments in Anchorage, Alaska',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
