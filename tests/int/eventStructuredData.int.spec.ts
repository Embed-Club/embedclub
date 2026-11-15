import { singleEventJsonLd } from '@/lib/structuredData'
import type { Event } from '@/payload/payload-types'
import { describe, expect, it } from 'vitest'

describe('singleEventJsonLd', () => {
  it('generates structured data for an in-person event', () => {
    const mockEvent: Event = {
      id: 21,
      title: 'EmbedThon: Agentic AI Hackathon',
      slug: 'embedthon-agentic-ai-hackathon',
      category: 'Hackathon',
      eventDate: '2026-11-20T09:00:00.000Z',
      eventMode: 'inPerson',
      shortDescription: 'Build next-gen AI agents in 24 hours.',
      venue: {
        roomName: 'Main Auditorium',
        floor: 'Ground Floor',
      },
      location: {
        address: 'PA College of Engineering, Mangalore',
      },
      description: {
        root: {
          type: 'root',
          children: [],
          direction: null,
          format: '',
          indent: 0,
          version: 1,
        },
      },
      createdAt: '2026-11-15T00:00:00.000Z',
      updatedAt: '2026-11-15T00:00:00.000Z',
    }

    const data = singleEventJsonLd(mockEvent)
    expect(data['@context']).toBe('https://schema.org')
    expect(data['@type']).toBe('Event')
    expect(data.name).toBe('EmbedThon: Agentic AI Hackathon')
    expect(data.description).toBe('Build next-gen AI agents in 24 hours.')
    expect(data.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode')
    expect(data.url).toContain('/events/embedthon-agentic-ai-hackathon')
    expect(data.mainEntityOfPage).toContain('/events/embedthon-agentic-ai-hackathon')

    const location = data.location as Record<string, unknown>
    expect(location['@type']).toBe('Place')
    expect(location.name).toBe('Main Auditorium')
  })

  it('generates structured data for an online event', () => {
    const mockEvent: Event = {
      id: 22,
      title: 'Virtual Agentic Systems Workshop',
      slug: 'virtual-agentic-systems',
      category: 'Workshop',
      eventDate: '2026-12-01T15:00:00.000Z',
      eventMode: 'online',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      description: {
        root: {
          type: 'root',
          children: [],
          direction: null,
          format: '',
          indent: 0,
          version: 1,
        },
      },
      createdAt: '2026-11-15T00:00:00.000Z',
      updatedAt: '2026-11-15T00:00:00.000Z',
    }

    const data = singleEventJsonLd(mockEvent)
    expect(data['@type']).toBe('Event')
    expect(data.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode')

    const location = data.location as Record<string, unknown>
    expect(location['@type']).toBe('VirtualLocation')
    expect(location.url).toBe('https://meet.google.com/abc-defg-hij')
  })
})
