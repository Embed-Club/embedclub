import type { Form, FormSubmission } from '@/payload/payload-types'
import config from '@/payload/payload.config'
import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

type AnswerMap = Record<string, unknown>

type QuestionAnalytics = {
  id: string
  label: string
  fieldType: string
  responses: number
  average: number | null
  options: { label: string; count: number }[]
}

type DashboardSubmission = {
  id: number
  name: string
  email: string
  createdAt: string
  certificateStatus: string | null
  answers: AnswerMap
  answersByLabel: AnswerMap
}

type FormAnalytics = {
  id: number | null
  title: string
  createdAt: string | null
  type: string | null
  active: boolean
  sectionLabel: string | null
  submissionCount: number
  latestSubmission: string | null
  questions: QuestionAnalytics[]
  submissions: DashboardSubmission[]
}

function answerMap(value: unknown): AnswerMap {
  if (!value || Array.isArray(value) || typeof value !== 'object') return {}
  return value as AnswerMap
}

function displayAnswer(value: unknown): string {
  if (Array.isArray(value)) return value.map(displayAnswer).filter(Boolean).join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function formFromRelation(value: FormSubmission['form']): Form | null {
  return value && typeof value === 'object' ? value : null
}

function buildQuestionAnalytics(form: Form, submissions: FormSubmission[]): QuestionAnalytics[] {
  const fields = (form.steps ?? []).flatMap((step) => step.fields ?? [])
  return fields
    .filter((field) => field.fieldType !== 'image' && field.fieldType !== 'imageUpload')
    .map((field) => {
      const values = submissions
        .map((submission) => answerMap(submission.answers)[field.id ?? ''])
        .filter((value) => displayAnswer(value) !== '')
      const numericValues = values
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
      const optionCounts = new Map<string, number>()
      for (const value of values) {
        for (const option of displayAnswer(value).split(', ').filter(Boolean)) {
          optionCounts.set(option, (optionCounts.get(option) ?? 0) + 1)
        }
      }
      return {
        id: field.id ?? field.label,
        label: field.label,
        fieldType: field.fieldType,
        responses: values.length,
        average: numericValues.length
          ? numericValues.reduce((total, value) => total + value, 0) / numericValues.length
          : null,
        options: [...optionCounts.entries()]
          .sort(([, a], [, b]) => b - a)
          .slice(0, 12)
          .map(([label, count]) => ({ label, count })),
      }
    })
}

function serializeSubmission(submission: FormSubmission): DashboardSubmission {
  return {
    id: submission.id,
    name: submission.submitterName?.trim() || 'Unnamed respondent',
    email: submission.submitterEmail?.trim() || 'No email',
    createdAt: submission.createdAt,
    certificateStatus: submission.certificateStatus ?? null,
    answers: answerMap(submission.answers),
    answersByLabel: answerMap(submission.answersByLabel),
  }
}

function buildOrphanQuestionAnalytics(submissions: FormSubmission[]): QuestionAnalytics[] {
  const labels = new Set<string>()
  for (const submission of submissions) {
    for (const label of Object.keys(answerMap(submission.answersByLabel))) labels.add(label)
  }
  return [...labels].map((label) => {
    const values = submissions
      .map((submission) => answerMap(submission.answersByLabel)[label])
      .filter((value) => displayAnswer(value) !== '')
    const optionCounts = new Map<string, number>()
    for (const value of values) {
      for (const option of displayAnswer(value).split(', ').filter(Boolean)) {
        optionCounts.set(option, (optionCounts.get(option) ?? 0) + 1)
      }
    }
    return {
      id: label,
      label,
      fieldType: 'archived answer',
      responses: values.length,
      average: null,
      options: [...optionCounts.entries()]
        .sort(([, a], [, b]) => b - a)
        .slice(0, 12)
        .map(([option, count]) => ({ label: option, count })),
    }
  })
}

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [formsResult, submissionsResult] = await Promise.all([
    payload.find({ collection: 'forms', depth: 1, limit: 1000, pagination: false }),
    payload.find({
      collection: 'form-submissions',
      depth: 1,
      limit: 10000,
      pagination: false,
      sort: '-createdAt',
    }),
  ])

  const forms = formsResult.docs as Form[]
  const submissions = submissionsResult.docs as FormSubmission[]
  const orphanSubmissions = submissions.filter((submission) => !formFromRelation(submission.form))
  const groups = new Map<string, FormAnalytics>()

  for (const form of forms) {
    groups.set(String(form.id), {
      id: form.id,
      title: form.title,
      createdAt: form.createdAt,
      type: form.type ?? null,
      active: Boolean(form.active),
      sectionLabel: form.sectionLabel ?? null,
      submissionCount: 0,
      latestSubmission: null,
      questions: [],
      submissions: [],
    })
  }

  if (orphanSubmissions.length) {
    groups.set('orphaned', {
      id: null,
      title: 'Deleted forms / unlinked responses',
      createdAt: null,
      type: null,
      active: false,
      sectionLabel: null,
      submissionCount: orphanSubmissions.length,
      latestSubmission: orphanSubmissions[0]?.createdAt ?? null,
      questions: buildOrphanQuestionAnalytics(orphanSubmissions),
      submissions: orphanSubmissions.map(serializeSubmission),
    })
  }

  for (const submission of submissions) {
    const form = formFromRelation(submission.form)
    if (!form) continue
    const group = groups.get(String(form.id))
    if (!group) continue
    group.submissions.push(serializeSubmission(submission))
    group.submissionCount += 1
    group.latestSubmission ??= submission.createdAt
  }

  for (const group of groups.values()) {
    const form = group.id === null ? null : forms.find((candidate) => candidate.id === group.id)
    if (form)
      group.questions = buildQuestionAnalytics(
        form,
        submissions.filter((submission) => formFromRelation(submission.form)?.id === form.id),
      )
  }

  const orderedGroups = [...groups.values()].sort((a, b) => {
    if (a.id === null) return 1
    if (b.id === null) return -1
    return b.submissionCount - a.submissionCount || a.title.localeCompare(b.title)
  })
  const totalSubmissions = submissions.length
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    formCount: forms.length,
    totalSubmissions,
    groups: orderedGroups,
  })
}
