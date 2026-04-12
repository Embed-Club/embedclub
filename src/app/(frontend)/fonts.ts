import localFont from 'next/font/local'

export const avantGarde = localFont({
  src: [
    {
      path: '../../../public/fonts/ITCAvantGardeStd-XLt.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/ITCAvantGardeStd-Md.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../../public/fonts/ITCAvantGardeStd-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-avant-garde',
  display: 'swap',
})

export const gobold = localFont({
  src: '../../../public/fonts/GoboldBold.otf',
  variable: '--font-gobold',
  display: 'swap',
})

export const sportBreak = localFont({
  src: '../../../public/fonts/SportBreakFreeVersion.otf',
  variable: '--font-sport-break',
  display: 'swap',
})
