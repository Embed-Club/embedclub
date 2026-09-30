import { parseGoogleFormHtml } from '@/lib/googleFormParser'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const url = (body?.url || '').trim()

    if (!url) {
      return NextResponse.json({ error: 'Please provide a Google Form URL.' }, { status: 400 })
    }

    if (!url.includes('google.com/forms') && !url.includes('forms.gle')) {
      return NextResponse.json(
        { error: 'Invalid URL. Please provide a valid docs.google.com/forms or forms.gle link.' },
        { status: 400 },
      )
    }

    // Follow redirects (especially for short forms.gle links)
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    })

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Could not load the Google Form (${res.status} ${res.statusText}). Make sure it is public and accepting responses.`,
        },
        { status: 400 },
      )
    }

    const html = await res.text()
    const parsed = parseGoogleFormHtml(html)

    return NextResponse.json({
      success: true,
      data: parsed,
    })
  } catch (error) {
    console.error('[GoogleFormImport] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import Google Form.' },
      { status: 500 },
    )
  }
}
