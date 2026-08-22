'use client'

import { Download, FileDown, FileSpreadsheet, Printer, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import styles from './formSubmissionsDashboard.module.css'

type QuestionAnalytics = {
  id: string
  label: string
  fieldType: string
  responses: number
  average: number | null
  options: { label: string; count: number }[]
}

type Submission = {
  id: number
  name: string
  email: string
  createdAt: string
  certificateStatus: string | null
  answers: Record<string, unknown>
  answersByLabel: Record<string, unknown>
}

type Group = {
  id: number | null
  title: string
  createdAt: string | null
  type: string | null
  active: boolean
  sectionLabel: string | null
  submissionCount: number
  latestSubmission: string | null
  questions: QuestionAnalytics[]
  submissions: Submission[]
}

type DashboardData = {
  generatedAt: string
  formCount: number
  totalSubmissions: number
  groups: Group[]
}

type NodePosition = { x: number; y: number }

function answerText(value: unknown): string {
  if (Array.isArray(value)) return value.map(answerText).filter(Boolean).join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function csvCell(value: unknown): string {
  return `"${answerText(value).replaceAll('"', '""')}"`
}

function downloadFile(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

function exportGroupCsv(group: Group) {
  const questionColumns = group.questions.map((question) => question.id)
  const lines = [
    [
      'Name',
      'Email',
      'Submitted at',
      'Certificate',
      ...group.questions.map((question) => question.label),
    ]
      .map(csvCell)
      .join(','),
    ...group.submissions.map((submission) =>
      [
        submission.name,
        submission.email,
        submission.createdAt,
        submission.certificateStatus ?? '',
        ...questionColumns.map((id) => submission.answers[id]),
      ]
        .map(csvCell)
        .join(','),
    ),
  ]
  downloadFile(
    `\ufeff${lines.join('\n')}`,
    `${group.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'responses'}.csv`,
    'text/csv;charset=utf-8',
  )
}

function exportGroupSvg(group: Group) {
  const width = 960
  const rowHeight = 34
  const height = Math.max(180, 96 + group.questions.length * rowHeight)
  const rows = group.questions
    .map((question, index) => {
      const top = 76 + index * rowHeight
      const max = Math.max(...question.options.map((option) => option.count), 1)
      const topOption = question.options[0]
      const average =
        question.average === null ? 'No numeric average' : `Average ${question.average.toFixed(2)}`
      return `<text x="28" y="${top}" fill="currentColor" font-size="14">${question.label.replaceAll('&', '&amp;')}</text><rect x="300" y="${top - 14}" width="420" height="10" rx="5" fill="currentColor" opacity=".16"/><rect x="300" y="${top - 14}" width="${topOption ? (topOption.count / max) * 420 : 0}" height="10" rx="5" fill="${'hsl(var(--primary))'}"/><text x="740" y="${top}" fill="currentColor" font-size="12">${topOption ? `${topOption.label}: ${topOption.count}` : average}</text>`
    })
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="white"/><text x="28" y="34" font-family="Arial, sans-serif" font-size="22" font-weight="700">${group.title.replaceAll('&', '&amp;')}</text><text x="28" y="56" font-family="Arial, sans-serif" font-size="13">${group.submissionCount} submissions</text><g font-family="Arial, sans-serif">${rows}</g></svg>`
  downloadFile(
    svg,
    `${group.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'analytics'}.svg`,
    'image/svg+xml;charset=utf-8',
  )
}

function DraggableGraph({ group }: { group: Group }) {
  const [positions, setPositions] = useState<Record<string, NodePosition>>({})
  const drag = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const nodes = useMemo(
    () => [
      {
        id: 'responses',
        title: group.title,
        meta: `${group.submissionCount} submissions`,
        strong: true,
      },
      ...group.questions.slice(0, 8).map((question) => ({
        id: question.id,
        title: question.label,
        meta: `${question.responses} answers`,
        strong: false,
      })),
    ],
    [group],
  )

  useEffect(() => {
    setPositions((previous) => {
      const next = { ...previous }
      nodes.forEach((node, index) => {
        next[node.id] ??= { x: 18 + (index % 4) * 160, y: 26 + Math.floor(index / 4) * 100 }
      })
      return next
    })
  }, [nodes])

  return (
    <div
      className={styles.graph}
      onPointerMove={(event) => {
        if (!drag.current) return
        const bounds = event.currentTarget.getBoundingClientRect()
        const x = Math.max(
          8,
          Math.min(bounds.width - 138, event.clientX - bounds.left - drag.current.offsetX),
        )
        const y = Math.max(
          8,
          Math.min(bounds.height - 76, event.clientY - bounds.top - drag.current.offsetY),
        )
        setPositions((previous) => ({ ...previous, [drag.current?.id ?? '']: { x, y } }))
      }}
      onPointerUp={() => {
        drag.current = null
      }}
      onPointerLeave={() => {
        drag.current = null
      }}
    >
      {nodes.map((node) => {
        const position = positions[node.id] ?? { x: 18, y: 20 }
        return (
          <div
            className={`${styles.node} ${node.strong ? styles.nodeStrong : ''}`}
            key={node.id}
            style={{ left: position.x, top: position.y }}
            onPointerDown={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect()
              event.currentTarget.setPointerCapture(event.pointerId)
              drag.current = {
                id: node.id,
                offsetX: event.clientX - bounds.left,
                offsetY: event.clientY - bounds.top,
              }
            }}
          >
            <span className={styles.nodeTitle}>{node.title}</span>
            <span className={styles.nodeMeta}>{node.meta}</span>
          </div>
        )
      })}
      <span className={styles.graphHint}>Drag nodes to inspect the response map</span>
    </div>
  )
}

function QuestionAnalyticsView({ questions }: { questions: QuestionAnalytics[] }) {
  if (!questions.length)
    return (
      <p className={styles.empty}>No question analytics are available for this response group.</p>
    )
  return (
    <div className={styles.analyticsGrid}>
      {questions.map((question) => {
        const max = Math.max(...question.options.map((option) => option.count), 1)
        return (
          <article className={styles.question} key={question.id}>
            <div className={styles.questionHeading}>
              <span>{question.label}</span>
              <span className={styles.questionType}>{question.fieldType}</span>
            </div>
            {question.average !== null && (
              <div className={styles.formMeta}>Average response: {question.average.toFixed(2)}</div>
            )}
            {question.options.slice(0, 5).map((option) => (
              <div className={styles.barRow} key={option.label}>
                <span title={option.label}>{option.label}</span>
                <span className={styles.barTrack}>
                  <span
                    className={styles.bar}
                    style={{ width: `${(option.count / max) * 100}%` }}
                  />
                </span>
                <strong>{option.count}</strong>
              </div>
            ))}
          </article>
        )
      })}
    </div>
  )
}

function SubmissionTable({ group }: { group: Group }) {
  const questions = group.questions.slice(0, 4)
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Submitted</th>
            <th>Certificate</th>
            {questions.map((question) => (
              <th key={question.id}>{question.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {group.submissions.map((submission) => (
            <tr key={submission.id}>
              <td>{submission.name}</td>
              <td>{submission.email}</td>
              <td>{new Date(submission.createdAt).toLocaleString()}</td>
              <td>{submission.certificateStatus ?? '-'}</td>
              {questions.map((question) => (
                <td className={styles.answerCell} key={question.id}>
                  {answerText(
                    submission.answers[question.id] ?? submission.answersByLabel[question.id],
                  ) || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GroupDetail({ group }: { group: Group }) {
  return (
    <div className={styles.detail}>
      <div className={styles.detailHeader}>
        <div>
          <h2 className={styles.detailTitle}>Response overview</h2>
          <p className={styles.intro}>
            Review the student list, answer patterns, and exportable records for this form.
          </p>
        </div>
        <div className={styles.buttonGroup}>
          <button className={styles.button} type="button" onClick={() => exportGroupCsv(group)}>
            <FileSpreadsheet size={15} /> Excel / CSV
          </button>
          <button className={styles.button} type="button" onClick={() => exportGroupSvg(group)}>
            <Download size={15} /> SVG chart
          </button>
          <button className={styles.button} type="button" onClick={() => window.print()}>
            <Printer size={15} /> Print / PDF
          </button>
        </div>
      </div>
      <p className={styles.sectionLabel}>Question analytics</p>
      <QuestionAnalyticsView questions={group.questions} />
      <p className={styles.sectionLabel}>Response map</p>
      <DraggableGraph group={group} />
      <p className={styles.sectionLabel}>Submitted people</p>
      {group.submissions.length ? (
        <SubmissionTable group={group} />
      ) : (
        <p className={styles.empty}>No submissions yet.</p>
      )}
    </div>
  )
}

export default function FormSubmissionsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'count' | 'title' | 'recent'>('recent')
  const [typeFilter, setTypeFilter] = useState<'all' | 'registration' | 'feedback' | 'general'>(
    'all',
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/form-submissions-analytics', {
        credentials: 'include',
      })
      const result = (await response.json()) as DashboardData & { error?: string }
      if (!response.ok)
        throw new Error(result.error || `Could not load submissions (${response.status})`)
      setData(result)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load submissions.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const groups = useMemo(() => {
    const filtered = (data?.groups ?? []).filter((group) => {
      const matchesQuery = group.title.toLowerCase().includes(query.toLowerCase())
      const matchesType = typeFilter === 'all' || group.type === typeFilter
      return matchesQuery && matchesType
    })
    return [...filtered].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title)
      if (sort === 'recent') return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
      return b.submissionCount - a.submissionCount
    })
  }, [data?.groups, query, sort, typeFilter])

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Coordinator workspace</p>
          <h1 className={styles.title}>Form submissions</h1>
          <p className={styles.intro}>
            See registration volume, student responses, and certificate status in one place. Open a
            form to inspect its full response record.
          </p>
        </div>
        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            type="button"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw size={15} /> {loading ? 'Refreshing' : 'Refresh data'}
          </button>
          <button className={styles.button} type="button" onClick={() => window.print()}>
            <FileDown size={15} /> Report
          </button>
        </div>
      </header>
      {loading && !data ? (
        <p className={styles.loading}>Loading response analytics...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : data ? (
        <>
          <section className={styles.summaryGrid} aria-label="Submission summary">
            <div className={styles.summary}>
              <span className={styles.summaryLabel}>Forms tracked</span>
              <strong className={styles.summaryValue}>{data.formCount}</strong>
            </div>
            <div className={styles.summary}>
              <span className={styles.summaryLabel}>Total submissions</span>
              <strong className={styles.summaryValue}>{data.totalSubmissions}</strong>
            </div>
            <div className={styles.summary}>
              <span className={styles.summaryLabel}>Last updated</span>
              <strong className={styles.summaryValue}>
                {new Date(data.generatedAt).toLocaleTimeString()}
              </strong>
            </div>
          </section>
          <div className={styles.toolbar}>
            <input
              className={styles.search}
              type="search"
              placeholder="Search forms"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className={styles.actions}>
              <select
                aria-label="Filter by form type"
                className={styles.select}
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
              >
                <option value="all">All forms</option>
                <option value="registration">Registrations</option>
                <option value="feedback">Feedback</option>
                <option value="general">General</option>
              </select>
              <select
                aria-label="Sort forms"
                className={styles.select}
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
              >
                <option value="recent">Recently added</option>
                <option value="count">Most submissions</option>
                <option value="title">Form title</option>
              </select>
            </div>
          </div>
          {!groups.length ? (
            <p className={styles.empty}>No response groups match this search.</p>
          ) : (
            groups.map((group, index) => (
              <details className={styles.accordion} key={group.id ?? 'orphaned'} open={index === 0}>
                <summary className={styles.summaryRow}>
                  <span className={styles.formName}>{group.title}</span>
                  <span className={styles.formMeta}>{group.type ?? 'Audit group'}</span>
                  <span className={`${styles.badge} ${group.active ? styles.badgeCopper : ''}`}>
                    {group.active ? 'Active' : 'Closed'}
                  </span>
                  <span className={styles.badge}>{group.submissionCount} responses</span>
                </summary>
                <GroupDetail group={group} />
              </details>
            ))
          )}
        </>
      ) : null}
    </main>
  )
}
