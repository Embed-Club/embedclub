import type { JsonLd } from '@/lib/structuredData'

/**
 * Renders JSON-LD into the page.
 *
 * The content is built by `lib/structuredData.ts` from CMS fields, never from
 * anything a visitor supplies, so `JSON.stringify` is the whole sanitisation
 * story. `<` is escaped anyway: a title containing `</script>` would otherwise
 * end the block early.
 */
export function JsonLdScript({ data }: { data: JsonLd | JsonLd[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: app-authored JSON-LD, escaped above
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
