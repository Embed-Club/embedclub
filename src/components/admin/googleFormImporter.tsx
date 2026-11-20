'use client'

import { toast, useAllFormFields, useDocumentInfo, useForm } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'
import { useState } from 'react'

export const GoogleFormImporter: UIFieldClientComponent = () => {
  const { id } = useDocumentInfo()
  const { dispatchFields, setModified } = useForm()
  const [fields] = useAllFormFields()

  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importedSummary, setImportedSummary] = useState<string | null>(null)

  const handleSyncPrevious = async () => {
    if (!id) return
    setSyncing(true)
    try {
      const res = await fetch(`/api/admin/forms/${id}/sync?force=true`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to sync submissions.')

      if (data.count === 0) {
        toast.info('No submissions found on this form to sync.')
      } else {
        const msg = `Processed ${data.count} submission(s): ${data.forwarded} forwarded to Google Forms, ${data.sheetSynced} synced to Sheets.`
        if (data.forwardFailed > 0) {
          toast.error(
            `${msg} (${data.forwardFailed} failed - check that Google Form accepts public responses)`,
          )
        } else {
          toast.success(msg)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed.'
      toast.error(msg)
    } finally {
      setSyncing(false)
    }
  }

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Please paste a Google Form link.')
      return
    }

    setBusy(true)
    setError(null)
    setImportedSummary(null)

    try {
      const res = await fetch('/api/forms/import-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to import Google Form.')
      }

      const { title, description, steps } = data.data

      // Auto-fill Title if currently empty or Untitled
      const currentTitle = fields?.title?.value as string | undefined
      if (!currentTitle || currentTitle === 'Untitled Form') {
        dispatchFields({
          type: 'UPDATE',
          path: 'title',
          value: title,
        })
      }

      // Auto-fill Description if currently empty
      const currentDesc = fields?.description?.value as string | undefined
      if (!currentDesc && description) {
        dispatchFields({
          type: 'UPDATE',
          path: 'description',
          value: description,
        })
      }

      // Update Steps
      if (steps && steps.length > 0) {
        dispatchFields({
          type: 'UPDATE',
          path: 'steps',
          value: steps,
        })
      }

      // Fill or update the Google Form URL for forwarding
      if (data.formUrl) {
        dispatchFields({
          type: 'UPDATE',
          path: 'googleFormUrl',
          value: data.formUrl,
        })
      }

      setModified(true)

      const totalQuestions = steps.reduce(
        (sum: number, s: { fields?: unknown[] }) => sum + (s.fields?.length || 0),
        0,
      )
      const summaryMsg = `Successfully imported "${title}" - ${totalQuestions} question(s) across ${steps.length} step(s).`
      setImportedSummary(summaryMsg)
      toast.success(summaryMsg)
      setUrl('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed.'
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
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
        gap: '12px',
      }}
    >
      <div>
        <label
          htmlFor="google-form-import-url"
          className="field-label"
          style={{
            display: 'block',
            margin: '0 0 4px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--theme-text)',
          }}
        >
          Import from Google Form
        </label>
        <p
          className="field-description"
          style={{
            margin: 0,
            fontSize: '12px',
            color: 'var(--theme-elevation-600)',
            lineHeight: 1.5,
          }}
        >
          Paste a public Google Form link to auto-fill title, steps, questions, options, and entry
          IDs for forwarding, or build manually below.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          id="google-form-import-url"
          type="url"
          placeholder="https://docs.google.com/forms/d/e/... or https://forms.gle/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={busy}
          style={{
            flex: '1 1 340px',
            padding: '7px 10px',
            borderRadius: '4px',
            border: '1px solid var(--theme-elevation-150)',
            backgroundColor: 'var(--theme-input-bg, var(--theme-elevation-50))',
            color: 'var(--theme-text)',
            fontSize: '13px',
            boxSizing: 'border-box',
          }}
        />

        <button
          type="button"
          className="btn btn--style-secondary btn--size-small"
          onClick={handleImport}
          disabled={busy || !url.trim()}
          style={{ margin: 0, whiteSpace: 'nowrap' }}
        >
          {busy ? 'Importing...' : 'Import Form'}
        </button>
      </div>

      {error && (
        <small style={{ color: 'var(--theme-error-500)', fontSize: '12px' }}>{error}</small>
      )}

      {importedSummary && (
        <small style={{ color: 'var(--theme-success-600)', fontSize: '12px' }}>
          {importedSummary}
        </small>
      )}

      {Boolean(id) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '8px',
            borderTop: '1px solid var(--theme-elevation-100)',
            marginTop: '4px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--theme-elevation-600)' }}>
            Have earlier registrations that didn't reach Google Forms?
          </span>
          <button
            type="button"
            className="btn btn--style-secondary btn--size-small"
            onClick={handleSyncPrevious}
            disabled={syncing}
            style={{ margin: 0, whiteSpace: 'nowrap' }}
          >
            {syncing ? 'Syncing...' : 'Sync Previous Submissions to Google'}
          </button>
        </div>
      )}
    </div>
  )
}

export default GoogleFormImporter
