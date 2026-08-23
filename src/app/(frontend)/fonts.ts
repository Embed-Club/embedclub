import localFont from 'next/font/local'

export const texGyreAdventor = localFont({
  src: [
    {
      path: '../../../public/texgyreadventor-regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../public/texgyreadventor-bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../../public/texgyreadventor-italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../../public/texgyreadventor-bolditalic.otf',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-tex-gyre-adventor',
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
