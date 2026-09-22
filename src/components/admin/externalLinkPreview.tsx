'use client'

import { resolveExternalResource } from '@/lib/externalResource'
import { useFormFields } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'

const KIND_LABELS: Record<string, string> = {
  youtube: 'YouTube video',
  vimeo: 'Vimeo video',
  driveFile: 'Google Drive file',
  driveFolder: 'Google Drive folder',
  pdf: 'PDF',
  website: 'Website',
}

/**
 * Live preview under the Link field so an editor can see the embed working
 * before saving. Same resolver as the public page, so what renders here is
 * what visitors get.
 */
const ExternalLinkPreview: UIFieldClientComponent = ({ path }) => {
  // `path` is `externalPreview`; the link sits beside it under the same parent.
  const siblingPath = path.split('.').slice(0, -1).concat('externalUrl').join('.')
  const url = useFormFields(([fields]) => fields[siblingPath]?.value) as string | undefined

  if (!url?.trim()) {
    return (
      <p style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', margin: 0 }}>
        Paste a link above to preview it here.
      </p>
    )
  }

  const resolved = resolveExternalResource(url)

  if (!resolved) {
    return (
      <p style={{ fontSize: '12px', color: 'var(--theme-error-500)', margin: 0 }}>
        That does not look like a valid link - it must start with https://
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', alignItems: 'center' }}>
        <span>
          Detected: <strong>{KIND_LABELS[resolved.kind]}</strong>
        </span>
        <a href={resolved.openUrl} target="_blank" rel="noreferrer">
          {resolved.openLabel}
        </a>
      </div>
      <iframe
        src={resolved.embedUrl}
        title="Link preview"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          width: '100%',
          aspectRatio: resolved.frame === 'video' ? '16 / 9' : '4 / 3',
          maxHeight: '520px',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: '6px',
          background: 'var(--theme-elevation-50)',
        }}
      />
      {resolved.kind === 'website' ? (
        <p style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', margin: 0 }}>
          Some sites refuse to load inside another page. If the box above stays blank, visitors will
          only get the &quot;Open Website&quot; button.
        </p>
      ) : null}
    </div>
  )
}

export default ExternalLinkPreview
