'use client'

import { Button } from '@/components/ui/button'
import { Check, FileText, Loader2, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'

interface FileUploadControlProps {
  fieldId: string
  formSlug: string
  value: string
  onChange: (value: string) => void
  onUploadingChange: (busy: boolean) => void
}

/**
 * Sends the picked file straight to the form's Google Drive folder and keeps
 * only the returned file id as the answer - nothing is stored on this site.
 *
 * The preview is a local object URL, so it costs no round trip. Nobody but a
 * member can read the file back from Drive afterwards, which is the point.
 */
export function FileUploadControl({
  fieldId,
  formSlug,
  value,
  onChange,
  onUploadingChange,
}: FileUploadControlProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [picked, setPicked] = useState<{ url: string | null; name: string } | null>(null)

  const release = (prev: { url: string | null } | null) => {
    if (prev?.url) URL.revokeObjectURL(prev.url)
  }

  const handlePick = async (file: File | undefined) => {
    if (!file) return
    setFailure(null)
    setBusy(true)
    onUploadingChange(true)
    setPicked((prev) => {
      release(prev)
      return {
        url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        name: file.name,
      }
    })

    try {
      const body = new FormData()
      body.append('file', file)
      body.append('formSlug', formSlug)
      body.append('fieldId', fieldId)
      const res = await fetch('/api/form-uploads', { method: 'POST', body })
      const json = (await res.json().catch(() => ({}))) as { id?: string; error?: string }
      if (!res.ok || !json.id) throw new Error(json.error || 'Upload failed - please try again.')
      onChange(json.id)
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'Upload failed - please try again.')
      onChange('')
      setPicked((prev) => {
        release(prev)
        return null
      })
    } finally {
      setBusy(false)
      onUploadingChange(false)
    }
  }

  const clear = () => {
    setPicked((prev) => {
      release(prev)
      return null
    })
    setFailure(null)
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id={fieldId}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => handlePick(e.target.files?.[0])}
      />

      {picked ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
          {picked.url ? (
            // Plain <img>: a blob: URL for the file just picked, which next/image cannot optimise.
            <img src={picked.url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm">{picked.name}</span>
            <span className="text-xs text-muted-foreground">
              {busy ? 'Uploading…' : value ? 'Attached' : ''}
            </span>
          </span>
          {busy ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : value ? (
            <>
              <Check className="h-4 w-4 shrink-0 text-primary" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clear}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : null}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Add file
        </Button>
      )}

      <p className="text-xs text-muted-foreground">Photo or PDF, up to 10 MB.</p>
      {failure && <p className="text-sm text-destructive">{failure}</p>}
    </div>
  )
}
