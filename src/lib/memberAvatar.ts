import 'server-only'

import { Avatar, Style, type StyleOptions } from '@dicebear/core'
import definition from '@dicebear/styles/avataaars.json' with { type: 'json' }

type MemberGender = 'male' | 'female' | 'unspecified' | null | undefined

const avataaars = new Style(definition)

// Keep the Sunrise-style filled background inside the existing Solder & Copper
// identity instead of introducing another site accent palette.
const AVATAR_BACKGROUND = ['#a05a20', '#d98e4a'] as const
const FEMALE_TOP = ['hijab'] as const
const MALE_TOP = [
  'dreads01',
  'frizzle',
  'shaggy',
  'shaggyMullet',
  'shortCurly',
  'shortFlat',
  'shortRound',
  'shortWaved',
  'theCaesar',
  'theCaesarAndSidePart',
] as const
const UNSPECIFIED_TOP = ['shortFlat', 'shortRound', 'straight01', 'curly'] as const
const ACCESSORIES = [
  'prescription01',
  'prescription02',
  'round',
  'sunglasses',
  'wayfarers',
] as const
const CLOTHES = [
  'blazerAndShirt',
  'blazerAndSweater',
  'collarAndSweater',
  'graphicShirt',
  'hoodie',
  'shirtCrewNeck',
  'shirtScoopNeck',
  'shirtVNeck',
] as const
const EYEBROWS = [
  'default',
  'defaultNatural',
  'flatNatural',
  'frownNatural',
  'raisedExcited',
  'raisedExcitedNatural',
  'sadConcerned',
  'sadConcernedNatural',
  'upDown',
  'upDownNatural',
] as const
const MOUTHS = [
  'default',
  'disbelief',
  'serious',
  'smile',
  'twinkle',
] as const
const HAIR_AND_FACIAL_HAIR_COLORS = [
  '#2c1b18', // black
  '#724133', // brown
  '#4a312c', // dark grey
  '#a55728', // medium brown
  '#b58143', // light brown
  '#d6b370', // peach
  '#f59797', // dark peach
  '#c93305', // dark peach
] as const
const SKIN_COLORS = ['#edb98a', '#ffdbb4'] as const

function pickVariant<T extends string>(seed: string, variants: readonly T[]): T {
  let hash = 2166136261
  for (const character of seed) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16777619)
  }
  return variants[(hash >>> 0) % variants.length] ?? variants[0]
}

/** Generate a deterministic server-side fallback for a member without a photo. */
export function generateMemberAvatar(seed: string, gender: MemberGender): string {
  const normalizedSeed = seed.trim() || 'Embed Club member'
  const isFemale = gender === 'female'
  const isMale = gender === 'male'
  const topVariants = isFemale ? FEMALE_TOP : isMale ? MALE_TOP : UNSPECIFIED_TOP
  const baseOptions: StyleOptions<typeof definition> = {
    seed: normalizedSeed,
    backgroundColor: AVATAR_BACKGROUND,
    backgroundColorFill: 'linear',
    backgroundColorAngle: 45,
    backgroundColorOrder: 'fixed',
    topVariant: pickVariant(normalizedSeed, topVariants),
    accessoriesVariant: ACCESSORIES,
    clothesVariant: CLOTHES,
    clothesGraphicProbability: 0,
    eyebrowsVariant: EYEBROWS,
    eyesVariant: 'default',
    mouthVariant: MOUTHS,
    hairColor: HAIR_AND_FACIAL_HAIR_COLORS,
    facialHairColor: HAIR_AND_FACIAL_HAIR_COLORS,
    skinColor: SKIN_COLORS,
  }

  const facialHairOptions: StyleOptions<typeof definition> = isMale
    ? { facialHairVariant: 'beardLight', facialHairProbability: 100 }
    : { facialHairProbability: 0 }

  return new Avatar(avataaars, { ...baseOptions, ...facialHairOptions }).toDataUri()
}
