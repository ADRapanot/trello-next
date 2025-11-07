import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AppStoreProvider } from "@/store/app-store"

export const metadata: Metadata = {
  title: "Trello Clone",
  description: "A Trello-like board management app",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased h-screen flex flex-col`}>
        <AppStoreProvider>{children}</AppStoreProvider>
        <Analytics />
      </body>
    </html>
  )
}
