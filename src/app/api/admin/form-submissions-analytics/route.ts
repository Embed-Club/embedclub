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
  attachments: { fieldId: string; label: string; fileName: string; url: string }[]
}

type FormAnalytics = {
  id: number | null
  title: string
  createdAt: string | null
  type: string | null
  active: boolean
  sectionLabel: string | null
  parentId: number | null
  parentTitle: string | null
  description: string | null
  headerImage: { url: string; alt: string } | null
  event: {
    title: string
    date: string
    mode: string
    description: string
    imageUrl: string | null
    location: string | null
  } | null
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

function richTextToPlainText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const node = value as { root?: unknown; children?: unknown[]; text?: unknown }
  if (typeof node.text === 'string') return node.text
  const children = Array.isArray(node.root) ? node.root : node.root ? [node.root] : node.children
  return Array.isArray(children) ? children.map(richTextToPlainText).filter(Boolean).join(' ') : ''
}

function mediaInfo(value: unknown): { url: string; alt: string } | null {
  if (!value || typeof value !== 'object') return null
  const media = value as { url?: unknown; alt?: unknown }
  return typeof media.url === 'string'
    ? { url: media.url, alt: typeof media.alt === 'string' ? media.alt : '' }
    : null
}

function formFromRelation(value: FormSubmission['form']): Form | null {
  return value && typeof value === 'object' ? value : null
}

function relationId(value: number | Form | null | undefined): number | null {
  if (typeof value === 'number') return value
  return value && typeof value === 'object' ? value.id : null
}

function questionForm(form: Form, forms: Form[]): Form {
  const parentId = relationId(form.sectionOf)
  const hasOwnQuestions = (form.steps ?? []).some((step) => (step.fields ?? []).length > 0)
  if (!parentId || hasOwnQuestions) return form
  return forms.find((candidate) => candidate.id === parentId) ?? form
}

function answerByLabel(answers: AnswerMap, labels: string[]): unknown {
  const wanted = labels.map((label) => label.trim().toLowerCase())
  const entry = Object.entries(answers).find(([label]) =>
    wanted.includes(label.trim().toLowerCase()),
  )
  return entry?.[1]
}

function buildQuestionAnalytics(form: Form, submissions: FormSubmission[]): QuestionAnalytics[] {
  const fields = (form.steps ?? []).flatMap((step) => step.fields ?? [])
  return fields
    .filter((field) => field.fieldType !== 'image' && field.fieldType !== 'imageUpload')
    .map((field) => {
      const values = submissions
        .map((submission) => {
          const answers = answerMap(submission.answers)
          const answersByLabel = answerMap(submission.answersByLabel)
          return answers[field.id ?? ''] ?? answersByLabel[field.label]
        })
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

function serializeSubmission(submission: FormSubmission, form?: Form): DashboardSubmission {
  const answersByLabel = answerMap(submission.answersByLabel)
  const fields = (form?.steps ?? []).flatMap((step) => step.fields ?? [])
  const nameField = fields.find((field) => field.role === 'name')
  const emailField = fields.find((field) => field.role === 'email')
  const recoveredName = answerByLabel(
    answersByLabel,
    [nameField?.label ?? '', 'name', 'full name', 'student name'].filter(Boolean),
  )
  const recoveredEmail = answerByLabel(
    answersByLabel,
    [emailField?.label ?? '', 'email', 'email address'].filter(Boolean),
  )
  return {
    id: submission.id,
    name: submission.submitterName?.trim() || displayAnswer(recoveredName) || 'Unnamed respondent',
    email: submission.submitterEmail?.trim() || displayAnswer(recoveredEmail) || 'No email',
    createdAt: submission.createdAt,
    certificateStatus: submission.certificateStatus ?? null,
    answers: answerMap(submission.answers),
    answersByLabel,
    attachments: (submission.attachments ?? [])
      .filter((attachment) => Boolean(attachment.driveFileId))
      .map((attachment) => ({
        fieldId: attachment.fieldId ?? '',
        label: attachment.label ?? 'Uploaded file',
        fileName: attachment.fileName ?? 'Drive file',
        url: `https://drive.google.com/file/d/${attachment.driveFileId}/view`,
      })),
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

  const forms: Form[] = []
  const submissions: FormSubmission[] = []
  let formsPage = 1
  let submissionsPage = 1
  while (true) {
    const result = await payload.find({
      collection: 'forms',
      depth: 2,
      limit: 1000,
      page: formsPage,
      sort: 'createdAt',
    })
    forms.push(...(result.docs as Form[]))
    if (!result.hasNextPage) break
    formsPage += 1
  }
  while (true) {
    const result = await payload.find({
      collection: 'form-submissions',
      depth: 1,
      limit: 1000,
      page: submissionsPage,
      sort: '-createdAt',
    })
    submissions.push(...(result.docs as FormSubmission[]))
    if (!result.hasNextPage) break
    submissionsPage += 1
  }
  const orphanSubmissions = submissions.filter((submission) => !formFromRelation(submission.form))
  const groups = new Map<string, FormAnalytics>()

  for (const form of forms) {
    const eventForm =
      form.relatedEvent || !form.sectionOf || typeof form.sectionOf !== 'object'
        ? form
        : form.sectionOf
    groups.set(String(form.id), {
      id: form.id,
      title: form.title,
      createdAt: form.createdAt,
      type: form.type ?? null,
      active: Boolean(form.active),
      sectionLabel: form.sectionLabel ?? null,
      parentId: form.sectionOf && typeof form.sectionOf === 'object' ? form.sectionOf.id : null,
      parentTitle:
        form.sectionOf && typeof form.sectionOf === 'object' ? form.sectionOf.title : null,
      description: form.description ?? null,
      headerImage: mediaInfo(form.headerImage),
      event:
        eventForm.relatedEvent && typeof eventForm.relatedEvent === 'object'
          ? {
              title: eventForm.relatedEvent.title,
              date: eventForm.relatedEvent.eventDate,
              mode: eventForm.relatedEvent.eventMode,
              description: richTextToPlainText(eventForm.relatedEvent.description),
              imageUrl: mediaInfo(eventForm.relatedEvent.image)?.url ?? null,
              location:
                eventForm.relatedEvent.eventMode === 'online'
                  ? (eventForm.relatedEvent.meetingLink ?? 'Online event')
                  : [
                      eventForm.relatedEvent.venue?.roomName,
                      eventForm.relatedEvent.venue?.floor,
                      eventForm.relatedEvent.location?.address,
                    ]
                      .filter(Boolean)
                      .join(', ') || null,
            }
          : null,
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
      parentId: null,
      parentTitle: null,
      description: null,
      headerImage: null,
      event: null,
      submissionCount: orphanSubmissions.length,
      latestSubmission: orphanSubmissions[0]?.createdAt ?? null,
      questions: buildOrphanQuestionAnalytics(orphanSubmissions),
      submissions: orphanSubmissions.map((submission) => serializeSubmission(submission)),
    })
  }

  for (const submission of submissions) {
    const form = formFromRelation(submission.form)
    if (!form) continue
    const group = groups.get(String(form.id))
    if (!group) continue
    group.submissions.push(serializeSubmission(submission, questionForm(form, forms)))
    group.submissionCount += 1
    group.latestSubmission ??= submission.createdAt
  }

  for (const group of groups.values()) {
    const form = group.id === null ? null : forms.find((candidate) => candidate.id === group.id)
    if (form) {
      const definition = questionForm(form, forms)
      group.questions = buildQuestionAnalytics(
        definition,
        submissions.filter((submission) => formFromRelation(submission.form)?.id === form.id),
      )
      if (!group.questions.length) {
        group.questions = buildOrphanQuestionAnalytics(
          submissions.filter((submission) => formFromRelation(submission.form)?.id === form.id),
        )
      }
    }
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
