import { resolveExternalResource } from '@/lib/externalResource'
import { describe, expect, it } from 'vitest'

describe('resolveExternalResource', () => {
  it('rewrites YouTube watch, short and shorts links to the nocookie player', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://youtube.com/shorts/dQw4w9WgXcQ',
    ]) {
      const r = resolveExternalResource(url)
      expect(r?.kind).toBe('youtube')
      expect(r?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
      expect(r?.openLabel).toBe('Open in YouTube')
      expect(r?.frame).toBe('video')
    }
  })

  it('turns a Drive share link into the framable /preview viewer', () => {
    const r = resolveExternalResource(
      'https://drive.google.com/file/d/1vtz8hkYK4xJb49MilXu7CCewyQgmGR_f/view?usp=sharing',
    )
    expect(r?.kind).toBe('driveFile')
    expect(r?.embedUrl).toBe(
      'https://drive.google.com/file/d/1vtz8hkYK4xJb49MilXu7CCewyQgmGR_f/preview',
    )
    expect(r?.openLabel).toBe('Open in Google Drive')
  })

  it('embeds a Drive folder as a list view', () => {
    const r = resolveExternalResource(
      'https://drive.google.com/drive/folders/14zYK4iRqScXc_urtddvGrXTR_0zVmela',
    )
    expect(r?.kind).toBe('driveFolder')
    expect(r?.embedUrl).toContain('embeddedfolderview?id=14zYK4iRqScXc_urtddvGrXTR_0zVmela')
  })

  it('labels bare PDFs and falls back to website for anything else', () => {
    expect(resolveExternalResource('https://example.com/paper.PDF')?.openLabel).toBe('Open PDF')
    expect(resolveExternalResource('https://shoogle.dev/')?.openLabel).toBe('Open Website')
  })

  it('rejects non-URLs and non-http schemes', () => {
    expect(resolveExternalResource('not a link')).toBeNull()
    expect(resolveExternalResource('javascript:alert(1)')).toBeNull()
    expect(resolveExternalResource('')).toBeNull()
  })
})
