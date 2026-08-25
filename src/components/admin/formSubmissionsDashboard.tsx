'use client'

import { Download, FileSpreadsheet, Printer, RefreshCw } from 'lucide-react'
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
  attachments: { fieldId: string; label: string; fileName: string; url: string }[]
}

type Group = {
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
  submissions: Submission[]
}

type DashboardData = {
  generatedAt: string
  formCount: number
  totalSubmissions: number
  groups: Group[]
}

const analyticsColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
]

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

function DraggableGraph({
  group,
  selectedQuestionId,
  onSelectQuestion,
}: {
  group: Group
  selectedQuestionId: string | null
  onSelectQuestion: (questionId: string) => void
}) {
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
        next[node.id] ??= { x: 18 + (index % 6) * 220, y: 24 + Math.floor(index / 6) * 104 }
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
          Math.max(
            8,
            Math.min(bounds.width - 208, event.clientX - bounds.left - drag.current.offsetX),
          ),
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
            className={`${styles.node} ${node.strong ? styles.nodeStrong : ''} ${selectedQuestionId === node.id ? styles.nodeSelected : ''}`}
            key={node.id}
            role={node.strong ? undefined : 'button'}
            tabIndex={node.strong ? undefined : 0}
            style={{ left: position.x, top: position.y }}
            onClick={() => {
              if (!node.strong) onSelectQuestion(node.id)
            }}
            onKeyDown={(event) => {
              if (!node.strong && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault()
                onSelectQuestion(node.id)
              }
            }}
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

function ResponseInspector({
  group,
  question,
  printMode,
}: {
  group: Group
  question: QuestionAnalytics
  printMode: boolean
}) {
  const responses = new Map<string, { count: number; people: Submission[] }>()
  for (const submission of group.submissions) {
    const value = submission.answers[question.id] ?? submission.answersByLabel[question.label]
    const labels = answerText(value).split(', ').filter(Boolean)
    for (const label of labels) {
      const response = responses.get(label) ?? { count: 0, people: [] }
      response.count += 1
      response.people.push(submission)
      responses.set(label, response)
    }
  }
  const optionLabels = question.options.map((option) => option.label)
  const responseLabels = [...new Set([...optionLabels, ...responses.keys()])]
  const maxResponse = Math.max(
    ...responseLabels.map((label) => responses.get(label)?.count ?? 0),
    1,
  )

  return (
    <section className={styles.responseInspector} aria-label={`Responses for ${question.label}`}>
      <div className={styles.inspectorHeader}>
        <div>
          <h3 className={styles.inspectorTitle}>{question.label}</h3>
          <p className={styles.formMeta}>
            {question.responses} response{question.responses === 1 ? '' : 's'} - select an option to
            see who chose it.
          </p>
        </div>
        <span className={styles.badge}>{question.fieldType}</span>
      </div>
      {responseLabels.length ? (
        <div className={styles.responseOptions}>
          {responseLabels.map((label, index) => {
            const response = responses.get(label)
            return (
              <details className={styles.responseOption} key={label} open={printMode}>
                <summary>
                  <span className={styles.responseLabel}>
                    <span
                      className={styles.responseColor}
                      style={{ background: analyticsColors[index % analyticsColors.length] }}
                    />
                    <span>{label}</span>
                  </span>
                  <span className={styles.responseBarTrack} aria-hidden="true">
                    <span
                      className={styles.responseBar}
                      style={{
                        width: `${((response?.count ?? 0) / maxResponse) * 100}%`,
                        background: analyticsColors[index % analyticsColors.length],
                      }}
                    />
                  </span>
                  <span
                    className={styles.badge}
                    style={{
                      borderColor: analyticsColors[index % analyticsColors.length],
                      color: analyticsColors[index % analyticsColors.length],
                    }}
                  >
                    {response?.count ?? 0}
                  </span>
                </summary>
                {response?.people.length ? (
                  <ul className={styles.respondentList}>
                    {response.people.map((person) => (
                      <li key={person.id}>
                        <strong>{person.name}</strong>
                        <span>{person.email}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.emptyInline}>No one selected this option.</p>
                )}
              </details>
            )
          })}
        </div>
      ) : (
        <p className={styles.emptyInline}>No responses recorded for this question.</p>
      )}
    </section>
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
            {question.options.slice(0, 5).map((option, index) => (
              <div className={styles.barRow} key={option.label}>
                <span title={option.label}>{option.label}</span>
                <span className={styles.barTrack}>
                  <span
                    className={styles.bar}
                    style={{
                      width: `${(option.count / max) * 100}%`,
                      animationDelay: `${question.options.indexOf(option) * 70}ms`,
                      background: analyticsColors[index % analyticsColors.length],
                    }}
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

function PieChart({ question }: { question: QuestionAnalytics }) {
  const options = question.options.filter((option) => option.count > 0)
  const total = options.reduce((sum, option) => sum + option.count, 0)
  if (!total) return <p className={styles.emptyInline}>No chart data for this question.</p>
  let start = -Math.PI / 2
  const slices = options.map((option, index) => {
    const angle = (option.count / total) * Math.PI * 2
    const end = start + angle
    const largeArc = angle > Math.PI ? 1 : 0
    const path = [
      'M 50 50',
      `L ${50 + 43 * Math.cos(start)} ${50 + 43 * Math.sin(start)}`,
      `A 43 43 0 ${largeArc} 1 ${50 + 43 * Math.cos(end)} ${50 + 43 * Math.sin(end)}`,
      'Z',
    ].join(' ')
    start = end
    return { ...option, path, color: analyticsColors[index % analyticsColors.length] }
  })
  return (
    <div className={styles.chartLayout}>
      <svg
        className={styles.pieChart}
        viewBox="0 0 100 100"
        role="img"
        aria-label={`${question.label} response chart`}
      >
        {slices.map((slice) => (
          <path className={styles.chartSlice} d={slice.path} fill={slice.color} key={slice.label} />
        ))}
        <circle cx="50" cy="50" fill="var(--theme-elevation-0)" r="20" />
      </svg>
      <div className={styles.chartLegend}>
        {slices.map((slice) => (
          <div className={styles.legendRow} key={slice.label}>
            <span className={styles.legendSwatch} style={{ background: slice.color }} />
            <span title={slice.label}>{slice.label}</span>
            <strong>{slice.count}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function PieChartsView({ questions }: { questions: QuestionAnalytics[] }) {
  const chartQuestions = questions.filter((question) =>
    question.options.some((option) => option.count > 0),
  )
  if (!chartQuestions.length) return <p className={styles.empty}>No pie-chart data is available.</p>
  return (
    <div className={styles.chartGrid}>
      {chartQuestions.map((question) => (
        <article className={styles.chartCard} key={question.id}>
          <h3>{question.label}</h3>
          <PieChart question={question} />
        </article>
      ))}
    </div>
  )
}

function answerForQuestion(submission: Submission, question: QuestionAnalytics): unknown {
  return submission.answers[question.id] ?? submission.answersByLabel[question.label]
}

function QuestionResponseReport({ group }: { group: Group }) {
  return (
    <div className={styles.responseReport}>
      {group.questions.map((question) => (
        <section className={styles.questionResponse} key={question.id}>
          <h3>{question.label}</h3>
          {group.submissions.map((submission) => {
            const answer = answerForQuestion(submission, question)
            const attachments = submission.attachments.filter(
              (attachment) =>
                attachment.fieldId === question.id || attachment.label === question.label,
            )
            return (
              <div className={styles.personResponse} key={submission.id}>
                <div className={styles.personIdentity}>
                  <strong>{submission.name}</strong>
                  <small>{submission.email}</small>
                </div>
                <span>{answerText(answer) || '-'}</span>
                {attachments.map((attachment) => (
                  <a href={attachment.url} key={attachment.url}>
                    {attachment.fileName} - {attachment.url}
                  </a>
                ))}
              </div>
            )
          })}
        </section>
      ))}
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

function FormPrintDetails({ group }: { group: Group }) {
  return (
    <section className={styles.printDetails}>
      <div className={styles.printFormHeading}>
        <div>
          <p className={styles.printRelationship}>
            {group.parentId
              ? `Child form - ${group.sectionLabel ?? group.title}`
              : 'Parent / standalone form'}
          </p>
          <h2>{group.title}</h2>
          {group.parentId && group.parentTitle && <p>Parent form: {group.parentTitle}</p>}
          {group.description && <p>{group.description}</p>}
        </div>
        {group.headerImage && <img src={group.headerImage.url} alt={group.headerImage.alt} />}
      </div>
      {group.event && (
        <div className={styles.printEvent}>
          {group.event.imageUrl && <img src={group.event.imageUrl} alt={group.event.title} />}
          <div>
            <h3>Event details</h3>
            <p>
              <strong>{group.event.title}</strong> - {new Date(group.event.date).toLocaleString()}
            </p>
            {group.event.location && <p>Location: {group.event.location}</p>}
            {group.event.description && <p>{group.event.description}</p>}
          </div>
        </div>
      )}
    </section>
  )
}

function PrintFormIndex({ groups }: { groups: Group[] }) {
  return (
    <section className={styles.printIndex}>
      <p className={styles.printRelationship}>Forms report</p>
      <h1>Form submissions</h1>
      <p>Complete form and event details, followed by each form’s response record.</p>
      <h2>Forms included</h2>
      <ol>
        {groups.map((group) => (
          <li key={group.id ?? 'orphaned'}>
            <strong>{group.title}</strong>
            <span>
              {group.parentId
                ? `Child form - ${group.sectionLabel ?? 'section'}`
                : 'Parent / standalone form'}
              {' - '}
              {group.submissionCount} responses
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function PrintReport({ groups, includeIndex }: { groups: Group[]; includeIndex: boolean }) {
  return (
    <div className={`${styles.printReport} ${includeIndex ? styles.printWithIndex : ''}`}>
      {includeIndex && <PrintFormIndex groups={groups} />}
      {groups.map((group) => (
        <section className={styles.printGroup} key={group.id ?? 'orphaned'}>
          <FormPrintDetails group={group} />
          <h2>Question analytics</h2>
          <QuestionResponseReport group={group} />
          <h2>Graph analytics</h2>
          <PieChartsView questions={group.questions} />
          <h2>Submitted people</h2>
          {group.submissions.length ? (
            <SubmissionTable group={group} />
          ) : (
            <p>No submissions yet.</p>
          )}
        </section>
      ))}
    </div>
  )
}

function GroupDetail({
  group,
  onPrint,
  printMode,
}: {
  group: Group
  onPrint: () => void
  printMode: boolean
}) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    group.questions[0]?.id ?? null,
  )
  const selectedQuestion = group.questions.find((question) => question.id === selectedQuestionId)
  const [responseView, setResponseView] = useState<'map' | 'charts'>('map')
  return (
    <div className={styles.detail}>
      <FormPrintDetails group={group} />
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
          <button className={styles.button} type="button" onClick={onPrint}>
            <Printer size={15} /> This form PDF
          </button>
        </div>
      </div>
      <p className={styles.sectionLabel}>Question analytics</p>
      <QuestionAnalyticsView questions={group.questions} />
      <div className={styles.tabList} role="tablist" aria-label="Response visualizations">
        <button
          className={`${styles.tab} ${responseView === 'map' ? styles.tabActive : ''}`}
          type="button"
          role="tab"
          aria-selected={responseView === 'map'}
          onClick={() => setResponseView('map')}
        >
          Response map
        </button>
        <button
          className={`${styles.tab} ${responseView === 'charts' ? styles.tabActive : ''}`}
          type="button"
          role="tab"
          aria-selected={responseView === 'charts'}
          onClick={() => setResponseView('charts')}
        >
          Pie charts
        </button>
      </div>
      {responseView === 'map' ? (
        <>
          <DraggableGraph
            group={group}
            selectedQuestionId={selectedQuestionId}
            onSelectQuestion={setSelectedQuestionId}
          />
          {selectedQuestion && (
            <ResponseInspector group={group} question={selectedQuestion} printMode={printMode} />
          )}
        </>
      ) : (
        <PieChartsView questions={group.questions} />
      )}
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
  const [printScope, setPrintScope] = useState<'all' | number | null>(null)

  const printDashboard = useCallback((scope: 'all' | number) => {
    setPrintScope(scope)
    requestAnimationFrame(() => window.print())
  }, [])

  useEffect(() => {
    const resetPrintMode = () => setPrintScope(null)
    window.addEventListener('afterprint', resetPrintMode)
    return () => window.removeEventListener('afterprint', resetPrintMode)
  }, [])

  const printMode = printScope !== null

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

  const printGroups = useMemo(() => {
    const source = printScope === 'all' ? (data?.groups ?? []) : groups
    return printScope === null
      ? []
      : source.filter((group) => printScope === 'all' || group.id === printScope)
  }, [data?.groups, groups, printScope])

  return (
    <main className={styles.page}>
      <div className={styles.screenContent}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Coordinator workspace</p>
            <h1 className={styles.title}>Form submissions</h1>
            <p className={styles.intro}>
              See registration volume, student responses, and certificate status in one place. Open
              a form to inspect its full response record.
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
            <button className={styles.button} type="button" onClick={() => printDashboard('all')}>
              <Printer size={15} /> Entire forms PDF
            </button>
          </div>
        </header>
        {loading && !data ? (
          <p className={styles.loading}>Loading response analytics...</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : data ? (
          <>
            {printScope === 'all' && <PrintFormIndex groups={groups} />}
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
              groups
                .filter(
                  (group) => printScope === 'all' || printScope === null || group.id === printScope,
                )
                .map((group, index) => (
                  <details
                    className={styles.accordion}
                    key={group.id ?? 'orphaned'}
                    open={printMode || index === 0}
                  >
                    <summary className={styles.summaryRow}>
                      <span className={styles.formName}>{group.title}</span>
                      <span className={styles.formMeta}>{group.type ?? 'Audit group'}</span>
                      <span className={`${styles.badge} ${group.active ? styles.badgeCopper : ''}`}>
                        {group.active ? 'Active' : 'Closed'}
                      </span>
                      <span className={styles.badge}>{group.submissionCount} responses</span>
                    </summary>
                    <GroupDetail
                      group={group}
                      onPrint={() => printDashboard(group.id ?? 'all')}
                      printMode={printMode}
                    />
                  </details>
                ))
            )}
          </>
        ) : null}
      </div>
      {data && printMode && (
        <PrintReport groups={printGroups} includeIndex={printScope === 'all'} />
      )}
    </main>
  )
}
