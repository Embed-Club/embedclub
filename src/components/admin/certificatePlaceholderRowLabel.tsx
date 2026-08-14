'use client'

import { useRowLabel } from '@payloadcms/ui'

/** Shows each certificate field as the marker it fills, so collapsed rows read. */
const CertificatePlaceholderRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{
    key?: string
    source?: string
    questionLabel?: string
    fixedValue?: string
  }>()

  if (!data?.key) return <span>{`Field ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`}</span>

  const from = data.source === 'fixed' ? data.fixedValue : data.questionLabel
  return (
    <span>
      {`{{${data.key}}}`}
      {from ? ` → ${from}` : ''}
    </span>
  )
}

export default CertificatePlaceholderRowLabel
