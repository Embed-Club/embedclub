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
      <div className="font-[Montserrat] font-extralight text-[28px] leading-[0.5] tracking-tighter md:text-[34px] lg:text-[36px]">
        WELCOME TO
      </div>
      <div className="text-[56px] font-extrabold [-webkit-text-stroke:0.8px] md:text-[66px] lg:text-[78px]">
        EMBED CLUB
      </div>
    </div>
  )
}
