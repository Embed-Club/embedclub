'use client'

import { useAllFormFields } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'
import { useState } from 'react'

/**
 * Every marker an officer has already written a row for.
 *
 * Read out of form state by path rather than with `useField`, because the
 * value Payload stores at an array field's own path is the number of rows,
 * not the rows — iterating it threw and took the whole edit view down.
 */
const ROW_KEY = /^certificatePlaceholders\.\d+\.key$/

function mappedKeys(fields: Record<string, { value?: unknown }>): string[] {
  return Object.entries(fields)
    .filter(([path]) => ROW_KEY.test(path))
    .map(([, field]) => (typeof field?.value === 'string' ? field.value : ''))
    .filter(Boolean)
}

/**
 * Reads the form's Slides template and reports the `{{markers}}` in it.
 *
 * Without this an officer has to remember exactly what they typed into the
 * deck and retype it here, and a typo is invisible until fifty certificates
 * have gone out with a literal `{{USN}}` on them. Scanning turns that into a
 * checklist.
 *
 * It only reports — filling the mapping rows in is left to the officer,
 * because the interesting half of the decision (where does this value come
 * from?) is one only they can answer.
 */
const CertificatePlaceholderScanner: UIFieldClientComponent = () => {
  const [fields] = useAllFormFields()

  const [found, setFound] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const templateId = (fields?.certificateTemplateDriveId?.value as string | undefined)?.trim()

  const scan = async () => {
    setBusy(true)
    setError(null)
    setFound(null)
    try {
      const res = await fetch(
        `/api/certificate-placeholders?templateId=${encodeURIComponent(templateId ?? '')}`,
        { credentials: 'include' },
      )
      const json = (await res.json()) as { placeholders?: string[]; error?: string }
      if (!res.ok) throw new Error(json.error || `Scan failed (${res.status})`)
      setFound(json.placeholders ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setBusy(false)
    }
  }

  // `name` and `event` are filled in without a mapping, so they never count as
  // missing. Compared case-insensitively, matching how Slides substitutes —
  // a deck written {{NAME}} is filled by a mapping keyed `name`.
  const covered = new Set(['name', 'event'])
  for (const key of mappedKeys(fields ?? {})) {
    covered.add(key.trim().toLowerCase())
  }
  const isCovered = (key: string) => covered.has(key.toLowerCase())
  const missing = (found ?? []).filter((key) => !isCovered(key))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          className="btn btn--style-secondary btn--size-small"
          onClick={scan}
          disabled={busy || !templateId}
          style={{ margin: 0 }}
        >
          {busy ? 'Scanning…' : 'Scan template for fields'}
        </button>
        {!templateId && (
          <small style={{ color: 'var(--theme-elevation-500)' }}>
            Paste the Google Slides link above first.
          </small>
        )}
      </div>

      {error && <small style={{ color: 'var(--theme-error-500)' }}>{error}</small>}

      {found && found.length === 0 && (
        <small style={{ color: 'var(--theme-elevation-600)' }}>
          No {'{{markers}}'} found in that template. Add them in Slides where you want values
          printed, e.g. {'{{name}}'}.
        </small>
      )}

      {found && found.length > 0 && (
        <div style={{ fontSize: '13px', lineHeight: 1.7 }}>
          <div>
            Found in the template:{' '}
            {found.map((key) => (
              <code
                key={key}
                style={{
                  marginRight: '6px',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: isCovered(key)
                    ? 'var(--theme-success-100, var(--theme-elevation-100))'
                    : 'var(--theme-warning-100, var(--theme-elevation-100))',
                }}
              >
                {`{{${key}}}`}
              </code>
            ))}
          </div>
          {missing.length > 0 ? (
            <div style={{ color: 'var(--theme-warning-600, var(--theme-elevation-700))' }}>
              {missing.length === 1 ? 'This one has' : 'These have'} no value set — add{' '}
              {missing.length === 1 ? 'a row' : 'rows'} below for{' '}
              {missing.map((key) => `{{${key}}}`).join(', ')}, or {'they'} will print literally on
              every certificate.
            </div>
          ) : (
            <div style={{ color: 'var(--theme-success-600, var(--theme-elevation-600))' }}>
              Every field has a value set.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CertificatePlaceholderScanner
