import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rewak Studios | Short-Term Rentals in Fairbanks, Alaska',
  description: 'Comfortable furnished rooms for short and extended stays in Fairbanks, Alaska. Perfect for business travelers, relocations, and visitors. Nightly, weekly, and monthly rates.',
  keywords: 'Fairbanks rentals, short-term rental, furnished room, Alaska lodging, extended stay Fairbanks, Rewak Studios',
  openGraph: {
    title: 'Rewak Studios | Short-Term Rentals in Fairbanks',
    description: 'Comfortable furnished rooms at 3483 Rewak Drive, Fairbanks, Alaska',
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
