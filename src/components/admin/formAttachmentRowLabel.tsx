'use client'

import { useRowLabel } from '@payloadcms/ui'

/** Names each attachment row by its question, so collapsed rows stay readable. */
const FormAttachmentRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ label?: string; fileName?: string }>()
  const index = String((rowNumber ?? 0) + 1).padStart(2, '0')
  return <span>{data?.label || data?.fileName || `Attachment ${index}`}</span>
}

export default FormAttachmentRowLabel
