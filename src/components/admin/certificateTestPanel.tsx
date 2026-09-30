'use client'

import { toast, useAllFormFields } from '@payloadcms/ui'
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
      const placeholders = result.placeholders ?? []
      setFound(placeholders)
      setValues((previous) => ({ event: previous.event || formTitle, ...previous }))
      const msg = `Found ${placeholders.length} template field(s).`
      setStatus(msg)
      toast.success(msg)
    } catch (scanError) {
      const msg = scanError instanceof Error ? scanError.message : 'Scan failed'
      setError(msg)
      toast.error(msg)
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
        toast.success('Certificate preview generated.')
      } else {
        setStatus('Test certificate emailed successfully.')
        toast.success('Test certificate emailed successfully.')
      }
    } catch (testError) {
      const msg = testError instanceof Error ? testError.message : 'Test failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div
      style={{
        padding: '16px 20px',
        marginBottom: '24px',
        borderRadius: '4px',
        border: '1px solid var(--theme-elevation-150)',
        background: 'var(--theme-elevation-50)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div>
        <span
          className="field-label"
          style={{
            display: 'block',
            margin: '0 0 4px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--theme-text)',
          }}
        >
          Test Certificate
        </span>
        <p
          className="field-description"
          style={{
            margin: 0,
            fontSize: '12px',
            color: 'var(--theme-elevation-600)',
            lineHeight: 1.5,
          }}
        >
          Scan the Google Slides template, fill the values below, then preview the certificate or
          email a test copy.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn--style-secondary btn--size-small"
          onClick={scan}
          disabled={busy !== null || !templateId}
          style={{ margin: 0 }}
        >
          {busy === 'scan' ? 'Scanning...' : 'Scan template'}
        </button>
        {!templateId && (
          <small style={{ color: 'var(--theme-elevation-500)', fontSize: '12px' }}>
            Add the Google Slides template above first.
          </small>
        )}
      </div>

      {keys.length > 0 && (
        <div style={{ display: 'grid', gap: '12px', maxWidth: '560px' }}>
          {keys.map((key) => {
            const inputId = `cert-test-key-${key}`
            return (
              <div key={key} style={{ display: 'grid', gap: '4px' }}>
                <label
                  htmlFor={inputId}
                  className="field-label"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    margin: 0,
                    color: 'var(--theme-text)',
                  }}
                >
                  {`{{${key}}}`}
                </label>
                <input
                  id={inputId}
                  type="text"
                  value={values[key] ?? (key === 'event' ? formTitle : '')}
                  onChange={(event) => updateValue(key, event.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '4px',
                    border: '1px solid var(--theme-elevation-150)',
                    backgroundColor: 'var(--theme-input-bg, var(--theme-elevation-50))',
                    color: 'var(--theme-text)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )
          })}
          <div style={{ display: 'grid', gap: '4px' }}>
            <label
              htmlFor="cert-test-email"
              className="field-label"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                margin: 0,
                color: 'var(--theme-text)',
              }}
            >
              Test email address
            </label>
            <input
              id="cert-test-email"
              type="email"
              value={testEmail}
              onChange={(event) => setTestEmail(event.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '4px',
                border: '1px solid var(--theme-elevation-150)',
                backgroundColor: 'var(--theme-input-bg, var(--theme-elevation-50))',
                color: 'var(--theme-text)',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn--style-secondary btn--size-small"
              onClick={() => runTest('preview')}
              disabled={busy !== null || !values.name?.trim() || !formId}
              style={{ margin: 0 }}
            >
              {busy === 'preview' ? 'Generating...' : 'Generate preview'}
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
              style={{ margin: 0 }}
            >
              {busy === 'email' ? 'Sending...' : 'Email test certificate'}
            </button>
          </div>
          {!emailTemplateReady && (
            <small style={{ color: 'var(--theme-elevation-500)', fontSize: '12px' }}>
              Add both an email subject and email body above to enable email testing.
            </small>
          )}
        </div>
      )}

      {status && (
        <small style={{ color: 'var(--theme-success-600)', fontSize: '12px' }}>{status}</small>
      )}
      {error && (
        <small style={{ color: 'var(--theme-error-500)', fontSize: '12px' }}>{error}</small>
      )}
      {previewUrl && (
        <iframe
          title="Certificate preview"
          src={previewUrl}
          style={{
            width: '100%',
            minHeight: '520px',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: '4px',
            backgroundColor: 'var(--theme-elevation-50)',
            marginTop: '8px',
          }}
        />
      )}
    </div>
  )
}

export default CertificateTestPanel
