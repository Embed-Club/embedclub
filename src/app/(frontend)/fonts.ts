import localFont from "next/font/local";

export const avantGarde = localFont({
  src: [
    {
      path: "./fonts/ITCAvantGardeStd-XLt.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "./fonts/ITCAvantGardeStd-Md.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/ITCAvantGardeStd-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-avant-garde",
  display: "swap",
});
