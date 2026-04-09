'use client'

import dynamic from 'next/dynamic'

const FrontendShell = dynamic(() => import('@/components/FrontendShell'), {
  ssr: false,
})

export default function FrontendShellWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <FrontendShell>{children}</FrontendShell>
}
