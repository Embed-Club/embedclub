'use client'

import dynamic from 'next/dynamic'

const ChromaGrid = dynamic(() => import('@/components/ChromaGrid'), {
  ssr: false,
})

export default function ChromaGridWrapper(props: any) {
  return <ChromaGrid {...props} />
}
