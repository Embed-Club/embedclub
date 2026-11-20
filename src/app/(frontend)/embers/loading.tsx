/**
 * Shown while /embers loads. A solid sheet of the page's own copper, in the same
 * place and colour as the sheet the Embed Days chooser slides over the screen, so
 * the slide, the load and the page's pixel reveal are one continuous orange field
 * and the site's logo loader never appears in between. `CopperPageReveal` paints
 * the same colour the moment the page mounts and then breaks it into pixels.
 */
export default function Loading() {
  return <div aria-hidden="true" className="fixed inset-0 z-[10000] bg-primary" />
}
