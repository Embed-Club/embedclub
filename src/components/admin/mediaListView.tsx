'use client'

import {
  Button,
  ConfirmationModal,
  DefaultListView,
  toast,
  useModal,
  useSelection,
} from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import type { ListViewClientProps } from 'payload'
import { useMemo, useState } from 'react'

type Usage = {
  id: number | string
  imageName: string
  location: string
}

type UsageGroup = {
  id: string
  imageName: string
  locations: string[]
}

const modalSlug = 'media-delete-and-replace'

function getErrorMessage(
  body: { errors?: Array<{ message?: string }>; message?: string },
  status: number,
) {
  const messages = body.errors?.map((error) => error.message).filter(Boolean)
  return messages?.join(' ') || body.message || `Media deletion failed with status ${status}.`
}

function MediaDeleteAction() {
  const { count, selectedIDs, toggleAll } = useSelection()
  const { closeModal, openModal } = useModal()
  const router = useRouter()
  const [usage, setUsage] = useState<Usage[]>([])
  const [loading, setLoading] = useState(false)

  const groupedUsage = useMemo(() => {
    const groups = new Map<string, UsageGroup>()
    for (const item of usage) {
      const id = String(item.id)
      const group = groups.get(id) || { id, imageName: item.imageName, locations: [] }
      group.locations.push(item.location)
      groups.set(id, group)
    }
    return [...groups.values()]
  }, [usage])

  const inspectSelection = async () => {
    if (count === 0) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      for (const id of selectedIDs) params.append('id', String(id))
      const response = await fetch(`/api/media/usage?${params.toString()}`, {
        credentials: 'include',
      })
      const body = (await response.json()) as {
        errors?: Array<{ message?: string }>
        message?: string
        usage?: Usage[]
      }
      if (!response.ok) throw new Error(getErrorMessage(body, response.status))
      setUsage(body.usage || [])
      openModal(modalSlug)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not check where these images are used.',
      )
    } finally {
      setLoading(false)
    }
  }

  const deleteSelection = async () => {
    setLoading(true)
    try {
      for (const id of selectedIDs) {
        const response = await fetch(`/api/media/${id}`, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
          method: 'DELETE',
        })
        const body = (await response.json()) as {
          errors?: Array<{ message?: string }>
          message?: string
        }
        if (!response.ok) throw new Error(getErrorMessage(body, response.status))
      }
      closeModal(modalSlug)
      toggleAll()
      toast.success(`${selectedIDs.length} image${selectedIDs.length === 1 ? '' : 's'} deleted.`)
      router.refresh()
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete the selected images.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        buttonStyle="error"
        disabled={count === 0 || loading}
        onClick={inspectSelection}
        size="small"
        type="button"
      >
        {loading ? 'Checking images...' : 'Delete and replace'}
      </Button>
      <ConfirmationModal
        body={
          <div>
            {groupedUsage.length > 0 ? (
              <>
                <p>
                  The selected images are used in the following locations. Deleting them will
                  replace those images with the shared placeholder image.
                </p>
                <ul>
                  {groupedUsage.map((group) => (
                    <li key={group.id}>
                      <strong>{group.imageName}</strong>
                      <ul>
                        {group.locations.map((location, index) => (
                          <li key={`${group.id}-${index}`}>{location}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>
                No content currently uses the selected images. They will be permanently deleted.
              </p>
            )}
          </div>
        }
        confirmingLabel="Deleting..."
        heading="Delete selected images?"
        modalSlug={modalSlug}
        onConfirm={deleteSelection}
      />
    </>
  )
}

export default function MediaListView(props: ListViewClientProps) {
  return (
    <DefaultListView
      {...props}
      beforeActions={[
        ...(props.beforeActions || []),
        <MediaDeleteAction key="media-delete-and-replace" />,
      ]}
      disableBulkDelete
    />
  )
}
