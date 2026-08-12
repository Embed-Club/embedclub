'use client'

import { useFormFields } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'

/**
 * Thumbnail for one respondent attachment, inside a form submission.
 *
 * The bytes never touch this site's storage — they are streamed from the
 * form's Google Drive folder through `/api/form-uploads/<id>`, which requires
 * an admin session. `loading="lazy"` matters here: a submission list can carry
 * hundreds of these, and each one is a round trip to Google.
 */
const FormAttachmentPreview: UIFieldClientComponent = ({ path }) => {
  // `path` is like `attachments.2.preview`; the sibling values sit beside it.
  const rowPath = path.split('.').slice(0, -1).join('.')

  const fileId = useFormFields(([fields]) => fields[`${rowPath}.driveFileId`]?.value) as
    | string
    | undefined
  const fileName = useFormFields(([fields]) => fields[`${rowPath}.fileName`]?.value) as
    | string
    | undefined
  const mimeType = useFormFields(([fields]) => fields[`${rowPath}.mimeType`]?.value) as
    | string
    | undefined

  if (!fileId) return null

  const href = `/api/form-uploads/${fileId}`
  const isImage = (mimeType ?? '').startsWith('image/')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {isImage ? (
        <a href={href} target="_blank" rel="noreferrer">
          {/* Plain <img>: next/image is not available inside the Payload admin
              bundle, and these are proxied Drive streams of unknown size. */}
          <img
            src={href}
            alt={fileName || 'Attachment'}
            loading="lazy"
            style={{
              maxWidth: '260px',
              maxHeight: '260px',
              borderRadius: '6px',
              border: '1px solid var(--theme-elevation-150)',
              objectFit: 'contain',
              background: 'var(--theme-elevation-50)',
            }}
          />
        </a>
      ) : null}
      <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
        <a href={href} target="_blank" rel="noreferrer">
          Open full size
        </a>
        <a
          href={`https://drive.google.com/file/d/${fileId}/view`}
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--theme-elevation-600)' }}
        >
          View in Drive
        </a>
      </div>
    </div>
  )
}

export default FormAttachmentPreview
