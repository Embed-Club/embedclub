'use client'

import { Link } from '@payloadcms/ui'
import { BarChart3 } from 'lucide-react'

export default function FormSubmissionsNavLink() {
  return (
    <Link className="nav__link" href="/admin/form-submissions-dashboard">
      <BarChart3 size={16} />
      <span>Submission analytics</span>
    </Link>
  )
}
