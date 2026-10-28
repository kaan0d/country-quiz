import type { Metadata, Viewport } from 'next'
import { Fraunces, Instrument_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-fraunces", axes: ["SOFT", "opsz"], style: ["normal", "italic"] });
const instrument = Instrument_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-instrument" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: 'Dünya Ülkeleri Oyunu',
  description: 'Dünyadaki tüm ülkeleri öğrenin - interaktif harita oyunu',
}

export const viewport: Viewport = {
  themeColor: "#f5efe1",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" className={`${fraunces.variable} ${instrument.variable} ${plexMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
