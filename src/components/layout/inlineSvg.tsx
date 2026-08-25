'use client'

interface InlineSVGProps {
  src: string
  className?: string
  style?: React.CSSProperties
}

/** Render the public SVG asset directly so path-converted artwork stays source-controlled. */
export function InlineSVG({ src, className, style }: InlineSVGProps) {
  return <img src={src} alt="" aria-hidden="true" className={className} style={style} />
}
