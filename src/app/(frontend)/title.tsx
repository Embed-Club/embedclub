'use client'

/**
 * The hero title, set as plain text.
 *
 * It used to scramble in through `DecryptedText` on view, but the landing
 * intro's logo fill and glide covers the whole viewport while that plays - the
 * effect had always finished by the time anything was visible.
 */
export default function DashboardTitle() {
  return (
    <div className="flex w-full flex-col items-center justify-center text-center">
      <div className="font-[Montserrat] text-[28px] md:text-[34px] tracking-tighter lg:text-[36px] font-[200] leading-[0.5]">WELCOME TO</div>
      <div className="text-[56px] md:text-[66px] lg:text-[78px] font-extrabold">EMBED CLUB</div>
    </div>
  )
}
