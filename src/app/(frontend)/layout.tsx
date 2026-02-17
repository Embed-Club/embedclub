import './globals.css'
import ThemeWrapper from '@/components/ThemeWrapper'
import { avantGarde } from './fonts'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={avantGarde.variable}>
      <head />
      <body className={`${avantGarde.className} font-medium`}>
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  )
}
