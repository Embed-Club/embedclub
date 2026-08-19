import config from '@/payload/payload.config'
import { type Payload, getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * Verifies the sortOrder conflict resolution on member-categories:
 * - create with no position → first free slot
 * - CREATE picking an occupied position → occupant chain shifts up (insert)
 * - EDIT picking an occupied position → true swap
 *
 * Assertions are relative (not hardcoded slot numbers) so the test passes
 * regardless of pre-existing data in the database.
 */

const SLUG = 'member-categories' as const
const run = Date.now()
const testSlug = (n: string) => `sort-test-${n}-${run}`

let payload: Payload
const createdIds: (string | number)[] = []
let snapshot: { id: string | number; sortOrder: number }[] = []

const allSortOrders = async () => {
  const res = await payload.find({ collection: SLUG, limit: 1000, depth: 0, sort: 'sortOrder' })
  return res.docs as unknown as { id: string | number; name: string; sortOrder: number }[]
}

const getDoc = async (id: string | number) =>
  (await payload.findByID({ collection: SLUG, id, depth: 0 })) as unknown as {
    id: string | number
    sortOrder: number
  }

describe('member-categories sortOrder conflicts', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    // Snapshot pre-existing docs so we can restore their positions afterwards
    snapshot = (await allSortOrders()).map((d) => ({ id: d.id, sortOrder: d.sortOrder }))
  })

  afterAll(async () => {
    for (const id of createdIds) {
      try {
        await payload.delete({ collection: SLUG, id })
      } catch {}
    }
    // Restore any pre-existing docs the insert-shift may have moved
    for (const snap of snapshot) {
      try {
        await payload.update({
          collection: SLUG,
          id: snap.id,
          data: { sortOrder: snap.sortOrder },
          context: { skipSortOrderConflicts: true },
        })
      } catch {}
    }
  })

  it('handles auto-assign, insert-shift on create, and swap on edit', async () => {
    // 1. Auto-assign: two creates land on distinct free slots
    // sortOrder is intentionally omitted on both creates - the beforeChange
    // hook auto-assigns it, but the generated type marks it required.
    // @ts-expect-error see above
    const a = (await payload.create({
      collection: SLUG,
      data: { name: `SortTest A ${run}`, slug: testSlug('a') },
    })) as unknown as { id: string | number; sortOrder: number }
    createdIds.push(a.id)

    // @ts-expect-error hook auto-assigns the required sortOrder
    const b = (await payload.create({
      collection: SLUG,
      data: { name: `SortTest B ${run}`, slug: testSlug('b') },
    })) as unknown as { id: string | number; sortOrder: number }
    createdIds.push(b.id)

    expect(a.sortOrder).toBeGreaterThan(0)
    expect(b.sortOrder).toBeGreaterThan(0)
    expect(a.sortOrder).not.toBe(b.sortOrder)

    // 2. CREATE picking A's occupied slot → C takes it, A shifts up
    const slotOfA = a.sortOrder
    const c = (await payload.create({
      collection: SLUG,
      // batchOrder has a defaultValue, but the generated type marks it required
      // on create - passed explicitly rather than suppressed, since this create
      // already passes sortOrder and so cannot use the @ts-expect-error above.
      data: {
        name: `SortTest C ${run}`,
        slug: testSlug('c'),
        sortOrder: slotOfA,
        batchOrder: 'oldestFirst',
      },
    })) as unknown as { id: string | number; sortOrder: number }
    createdIds.push(c.id)

    expect(c.sortOrder).toBe(slotOfA)
    const aAfterInsert = await getDoc(a.id)
    expect(aAfterInsert.sortOrder).toBeGreaterThan(slotOfA)

    // No duplicates anywhere after the insert
    let orders = (await allSortOrders()).map((d) => d.sortOrder)
    expect(new Set(orders).size).toBe(orders.length)

    // 3. EDIT: move C onto B's occupied slot → swap (B takes C's old slot)
    const bBefore = await getDoc(b.id)
    const cBefore = await getDoc(c.id)
    const updatedC = (await payload.update({
      collection: SLUG,
      id: c.id,
      data: { sortOrder: bBefore.sortOrder },
    })) as unknown as { sortOrder: number }

    expect(updatedC.sortOrder).toBe(bBefore.sortOrder)
    const bAfterSwap = await getDoc(b.id)
    expect(bAfterSwap.sortOrder).toBe(cBefore.sortOrder)

    // Still no duplicates
    orders = (await allSortOrders()).map((d) => d.sortOrder)
    expect(new Set(orders).size).toBe(orders.length)
  }, 60_000)
})
