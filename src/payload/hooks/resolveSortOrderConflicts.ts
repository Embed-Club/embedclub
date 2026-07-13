import type { CollectionBeforeChangeHook } from 'payload'

type SortedCollection = 'member-categories' | 'member-roles'

interface SortableDoc {
  id: string | number
  sortOrder?: number | null
}

/**
 * Makes the sortOrder dropdown behave like people expect:
 *
 * - No position picked → the doc takes the first free slot.
 * - Picked a FREE position → nothing else moves.
 * - EDIT picks an OCCUPIED position → true swap: the occupant takes this
 *   doc's old position.
 * - CREATE picks an OCCUPIED position → insert: the occupant (and any
 *   contiguous chain after it) shifts up by one until a gap.
 *
 * Displaced docs are updated with `skipSortOrderConflicts` in context so their
 * own beforeChange hook doesn't cascade forever.
 */
export const createSortOrderBeforeChange =
  (slug: SortedCollection): CollectionBeforeChangeHook =>
  async ({ data, req, originalDoc, context }) => {
    if (context?.skipSortOrderConflicts) return data

    // Normalize (admin can send strings)
    let desired: number | undefined | null = data.sortOrder as number | undefined | null
    if (typeof desired === 'string') {
      const parsed = Number.parseInt(desired, 10)
      desired = Number.isFinite(parsed) ? parsed : undefined
    }

    const all = await req.payload.find({
      collection: slug,
      limit: 1000,
      depth: 0,
      sort: 'sortOrder',
    })
    const currentId = (originalDoc as SortableDoc | undefined)?.id
    const others = (all.docs as unknown as SortableDoc[]).filter(
      (d) => String(d.id) !== String(currentId),
    )
    const bySort = new Map<number, SortableDoc>()
    for (const d of others) {
      const n = Number(d.sortOrder)
      if (Number.isFinite(n)) bySort.set(n, d)
    }

    // No position picked → first free slot
    if (desired === undefined || desired === null || Number.isNaN(desired)) {
      let slot = 1
      while (bySort.has(slot)) slot++
      data.sortOrder = slot
      return data
    }

    data.sortOrder = desired
    const occupant = bySort.get(desired)
    if (!occupant) return data // free slot, done

    const previous = (originalDoc as SortableDoc | undefined)?.sortOrder
    const hadPrevious =
      typeof previous === 'number' && Number.isFinite(previous) && previous !== desired

    if (hadPrevious && !bySort.has(previous)) {
      // Swap: occupant takes the slot this doc is vacating
      await req.payload.update({
        collection: slug,
        id: occupant.id,
        data: { sortOrder: previous },
        depth: 0,
        context: { skipSortOrderConflicts: true },
      })
      return data
    }

    // Insert: shift the contiguous chain starting at `desired` up by one.
    // Walk the chain first, then update from the end so no transient overlaps.
    const chain: SortableDoc[] = []
    let slot = desired
    while (bySort.has(slot)) {
      chain.push(bySort.get(slot) as SortableDoc)
      slot++
    }
    for (let i = chain.length - 1; i >= 0; i--) {
      const docToMove = chain[i]
      await req.payload.update({
        collection: slug,
        id: docToMove.id,
        data: { sortOrder: Number(docToMove.sortOrder) + 1 },
        depth: 0,
        context: { skipSortOrderConflicts: true },
      })
    }
    return data
  }
