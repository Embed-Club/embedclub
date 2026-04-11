import localFont from 'next/font/local'

export const avantGarde = localFont({
  src: [
    {
      path: '../../styles/fonts/ITCAvantGardeStd-XLt.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../../styles/fonts/ITCAvantGardeStd-Md.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../styles/fonts/ITCAvantGardeStd-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-avant-garde',
  display: 'swap',
})

export const gobold = localFont({
  src: '../../styles/fonts/Gobold Bold.otf',
  variable: '--font-gobold',
  display: 'swap',
})

export const sportBreak = localFont({
  src: '../../styles/fonts/Sport Break Free Version.otf',
  variable: '--font-sport-break',
  display: 'swap',
})
