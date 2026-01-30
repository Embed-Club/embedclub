import './globals.css'
import ThemeWrapper from '@/components/theme-wrapper'
import { avantGarde } from './fonts'
import CustomCursor from '@/components/cursor'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={avantGarde.variable}>
      <head />
      <body className={`${avantGarde.className} font-medium`}>
        <CustomCursor />
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  )
}
