import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: 'Dünya Ülkeleri Oyunu',
  description: 'Dünyadaki tüm ülkeleri öğrenin - interaktif harita oyunu',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" className={geist.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
