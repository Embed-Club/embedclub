export type EventType = 'embers' | 'embedthon'

export const eventDetails = {
  embers: {
    name: "Embers '26",
    date: '25 November 2026',
    day: 'Wednesday',
    time: '08:30 to 17:00',
    location: 'PACE Campus, Mangaluru',
    label: 'A National Level Technical Fest',
    tagline: 'Ideas / Build / Innovate',
    description:
      'Embers brings student makers, researchers, and problem-solvers together for a day of live demonstrations and original ideas. Enter Project Expo with a working prototype or take the stage for Paper Presentation. Bring work you believe in, learn from the room, and compete for cash prizes.',
    registerLabel: "Register for Embers '26",
    tracksLabel: 'View event tracks',
    start: '2026-11-25T08:30:00+05:30',
  },
  embedthon: {
    name: 'Embedthon',
    date: '24 - 25 November 2026',
    day: 'Monday - Tuesday',
    time: 'Workshop: 09:00 to 15:00',
    location: 'Seminar Hall, PACE Campus',
    label: 'Agentic AI: End-to-End Software Development',
    tagline: 'Learn / Build / Ship',
    description:
      'Embedthon is a two-day hands-on event for second-year CSE students. Start with a practical workshop on AI coding agents, then work with your team through a 24-hour hackathon to turn an idea into working software.',
    registerLabel: 'Register for Embedthon',
    tracksLabel: 'See the programme',
    start: '2026-11-24T09:00:00+05:30',
  },
} as const
