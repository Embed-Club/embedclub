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
