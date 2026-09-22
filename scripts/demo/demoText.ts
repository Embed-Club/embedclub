/**
 * Text fixtures for the demo dataset.
 *
 * The point of these is not to read well - it is to break layouts that only
 * ever saw comfortable copy. A card sized around a four-word title looks fine
 * until someone writes a fourteen-word one, and a bio field that has only held
 * two sentences hides its overflow until it holds ten.
 *
 * Every string here is invented. No real member, event or contact detail is in
 * the demo data, so a fork carries nothing that belongs to anyone.
 */

/** A title long enough to wrap two or three times in a card. */
export const LONG_TITLE =
  'Building a Low-Power Environmental Monitoring Node That Survives a Full Monsoon Season Outdoors'

/** The other extreme - some layouts collapse when there is almost nothing. */
export const SHORT_TITLE = 'Pi Day'

/** A single unbroken token, which is what actually overflows a flex container. */
export const UNBROKEN_TOKEN =
  'ESP32-WROOM-32E-N8R2-Development-Board-With-Integrated-Antenna-And-Shielding'

/** Right at the 200-character card limit, to prove the clamp works. */
export const MAX_LENGTH_DESCRIPTION =
  'A deliberately long summary that runs all the way to the two hundred character limit the card description field enforces, so the two-line clamp and its ellipsis can be seen doing their job here.'

export const SHORT_DESCRIPTION = 'One line.'

/** Non-ASCII, because names and places here are not all plain Latin text. */
export const UNICODE_SAMPLE = 'Karnataka - ಕರ್ನಾಟಕ - 28°C at 3 m'

/** Paragraphs of filler for rich-text bodies, varied in length on purpose. */
export const PARAGRAPHS = [
  'This is demo content. It exists so the page has something to render while you work on the layout, and it will be replaced by whatever the club actually publishes.',
  'The paragraph below is much longer. It is here to show what a real write-up does to the reading column, the table of contents, and the estimated reading time, none of which behave the same way against two polite sentences of filler. A tutorial that someone has actually sat down and written tends to run to several hundred words per section, with asides, warnings about the hardware, and at least one paragraph explaining why the obvious approach does not work. If the column measure is wrong, or the line height is too tight, or the headings do not have enough space above them, this is the length at which it starts to be uncomfortable rather than the length at which it looks fine.',
  'Short one.',
]

/** Bios: an empty one, a terse one, and one that overruns any fixed-height card. */
export const BIOS = {
  none: undefined,
  short: 'Second year. Likes soldering.',
  long: 'Joined in first year with no electronics background at all and spent the first semester mostly breaking things, which turned out to be the fastest way to learn what a pull-up resistor is actually for. Now works mainly on low-power sensor nodes and the firmware that keeps them asleep, and helps run the Saturday workshops for anyone who wants to start where they started.',
}

/**
 * Invented names, mixed in length and shape: a single word, a very long one,
 * and ordinary ones. Nothing here belongs to a real person.
 */
export const DEMO_MEMBERS = [
  { fullName: 'Aarav Kulkarni', gender: 'male' as const },
  { fullName: 'Meera', gender: 'female' as const },
  {
    fullName: 'Lakshmi Narasimhan Venkataraghavan',
    gender: 'female' as const,
  },
  { fullName: 'Zoya Fernandes', gender: 'female' as const },
  { fullName: 'Rohan Dsouza', gender: 'male' as const },
  { fullName: 'Ibrahim Sait', gender: 'male' as const },
]
