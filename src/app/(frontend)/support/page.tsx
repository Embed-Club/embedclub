import { permanentRedirect } from 'next/navigation'

/**
 * /support merged into /contact - the support answers now live there as an
 * accordion above the email/phone cards. Kept as a permanent redirect so old
 * links and anything already indexed still land somewhere useful.
 */
export default function Page() {
  permanentRedirect('/contact')
}
