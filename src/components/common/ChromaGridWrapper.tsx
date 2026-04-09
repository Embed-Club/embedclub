'use client'

import dynamic from 'next/dynamic'

const ChromaGrid = dynamic(() => import('@/components/common/ChromaGrid'), {
  ssr: false,
})

export default function ChromaGridWrapper(props: Record<string, unknown>) {
  return <ChromaGrid {...props} />
}
