'use client'

import {
  toast,
  useBulkUpload,
  useDocumentDrawerContext,
  useDocumentInfo,
  useModal,
} from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'
import { useRef } from 'react'

/**
 * "Upload several" on the Media create form.
 *
 * The Media list view already has Payload's Bulk Upload button (the same one
 * Gallery and Member Photos use), but Payload hides it inside drawers. So an
 * editor filling an Image Block who hits "Create New" could only add one file
 * at a time. This opens the same bulk drawer from there: drop a batch, give
 * each an alt text, and they all land in the library ready for "Choose from
 * existing" in later blocks.
 */
const MediaBulkUploadButton: UIFieldClientComponent = () => {
  const { id } = useDocumentInfo()
  const { drawerSlug: docDrawerSlug } = useDocumentDrawerContext()
  const { closeModal, isModalOpen, openModal } = useModal()
  const { drawerSlug, setCollectionSlug, setInitialFiles, setOnSuccess } = useBulkUpload()
  const inputRef = useRef<HTMLInputElement>(null)

  // Only meaningful while creating; an existing doc already has its one file.
  // The bulk drawer renders this same form once per file, so hide it there too.
  if (id || isModalOpen(drawerSlug)) return null

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return
    setCollectionSlug('media')
    setInitialFiles(files)
    setOnSuccess((uploaded) => {
      toast.success(
        `${uploaded.length} image${uploaded.length === 1 ? '' : 's'} added to Media. Pick one with "Choose from existing".`,
      )
      // Back to the block that opened this drawer, where the new images are
      // now selectable.
      if (docDrawerSlug) closeModal(docDrawerSlug)
    })
    openModal(drawerSlug)
    // Let the same files be picked again if the editor cancels.
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div style={{ marginBottom: 'var(--base)' }}>
      <input
        accept="image/*"
        hidden
        multiple
        onChange={(e) => onFiles(e.target.files)}
        ref={inputRef}
        type="file"
      />
      <button
        className="btn btn--style-secondary btn--size-small"
        onClick={() => inputRef.current?.click()}
        style={{ margin: 0 }}
        type="button"
      >
        Upload several images at once
      </button>
      <p className="field-description" style={{ marginTop: 'calc(var(--base) / 4)' }}>
        Adds them all to the Media library. Then use "Choose from existing" to place each one.
      </p>
    </div>
  )
}

export default MediaBulkUploadButton
