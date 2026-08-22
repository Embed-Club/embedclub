'use client'

import { useAllFormFields } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'
import { useMemo, useState } from 'react'

type TestResponse = {
  error?: string
  ok?: boolean
  pdfBase64?: string
  mimeType?: string
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** Admin-only certificate smoke test: scan, fill, preview, or email a copy. */
const CertificateTestPanel: UIFieldClientComponent = () => {
  const [fields] = useAllFormFields()
  const [found, setFound] = useState<string[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [testEmail, setTestEmail] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'scan' | 'preview' | 'email' | null>(null)

  const templateId = stringValue(fields?.certificateTemplateDriveId?.value).trim()
  const formTitle = stringValue(fields?.title?.value)
  const formId = Number(fields?.id?.value)
  const emailTemplateReady = Boolean(
    stringValue(fields?.certificateEmailSubject?.value).trim() &&
      stringValue(fields?.certificateEmailBody?.value).trim(),
  )
  const keys = useMemo(() => [...new Set(['name', 'event', ...found])], [found])

  const updateValue = (key: string, value: string) => {
    setValues((previous) => ({ ...previous, [key]: value }))
  }

  const scan = async () => {
    setBusy('scan')
    setError(null)
    setStatus(null)
    try {
      const response = await fetch(
        `/api/certificate-placeholders?templateId=${encodeURIComponent(templateId)}`,
        { credentials: 'include' },
      )
      const result = (await response.json()) as { placeholders?: string[]; error?: string }
      if (!response.ok) throw new Error(result.error || `Scan failed (${response.status})`)
      setFound(result.placeholders ?? [])
      setValues((previous) => ({ event: previous.event || formTitle, ...previous }))
      setStatus(`Found ${(result.placeholders ?? []).length} template fields.`)
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Scan failed')
    } finally {
      setBusy(null)
    }
  }

  const runTest = async (mode: 'preview' | 'email') => {
    setBusy(mode)
    setError(null)
    setStatus(null)
    setPreviewUrl(null)
    try {
      const response = await fetch('/api/certificate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          formId,
          mode,
          name: values.name,
          email: testEmail,
          placeholders: values,
        }),
      })
      const result = (await response.json()) as TestResponse
      if (!response.ok) throw new Error(result.error || `Test failed (${response.status})`)

      if (mode === 'preview' && result.pdfBase64) {
        setPreviewUrl(`data:${result.mimeType || 'application/pdf'};base64,${result.pdfBase64}`)
        setStatus('Preview generated.')
      } else {
        setStatus('Test certificate emailed successfully.')
      }
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : 'Test failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '1.5rem' }}>
      <p style={{ margin: 0 }}>
        Scan the Google Slides template, fill the values below, then preview the certificate or
        email a test copy.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn--style-secondary btn--size-small"
          onClick={scan}
          disabled={busy !== null || !templateId}
        >
          {busy === 'scan' ? 'Scanning…' : 'Scan template'}
        </button>
        {!templateId && <small>Add the Google Slides template above first.</small>}
      </div>

      {keys.length > 0 && (
        <div style={{ display: 'grid', gap: '10px', maxWidth: '560px' }}>
          {keys.map((key) => (
            <label key={key} style={{ display: 'grid', gap: '4px' }}>
              <span style={{ fontWeight: 600 }}>{`{{${key}}}`}</span>
              <input
                type="text"
                value={values[key] ?? (key === 'event' ? formTitle : '')}
                onChange={(event) => updateValue(key, event.target.value)}
                className="field-type text"
              />
            </label>
          ))}
          <label style={{ display: 'grid', gap: '4px' }}>
            <span style={{ fontWeight: 600 }}>Test email address</span>
            <input
              type="email"
              value={testEmail}
              onChange={(event) => setTestEmail(event.target.value)}
              className="field-type text"
              placeholder="you@example.com"
            />
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn--style-primary btn--size-small"
              onClick={() => runTest('preview')}
              disabled={busy !== null || !values.name?.trim() || !formId}
            >
              {busy === 'preview' ? 'Generating…' : 'Generate preview'}
            </button>
            <button
              type="button"
              className="btn btn--style-secondary btn--size-small"
              onClick={() => runTest('email')}
              disabled={
                busy !== null ||
                !values.name?.trim() ||
                !testEmail.trim() ||
                !formId ||
                !emailTemplateReady
              }
            >
              {busy === 'email' ? 'Sending…' : 'Email test certificate'}
            </button>
          </div>
          {!emailTemplateReady && (
            <small>Add both an email subject and email body above to enable email testing.</small>
          )}
        </div>
      )}

      {status && (
        <small style={{ color: 'var(--theme-success-600, var(--theme-elevation-700))' }}>
          {status}
        </small>
      )}
      {error && <small style={{ color: 'var(--theme-error-500)' }}>{error}</small>}
      {previewUrl && (
        <iframe
          title="Certificate preview"
          src={previewUrl}
          style={{
            width: '100%',
            minHeight: '520px',
            border: '1px solid var(--theme-elevation-150)',
          }}
        />
      )}
    </div>
  )
}

export default CertificateTestPanel
