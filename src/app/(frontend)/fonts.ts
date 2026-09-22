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
