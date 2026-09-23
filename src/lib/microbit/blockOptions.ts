/**
 * The choices inside the micro:bit blocks' dropdowns. Each pair is
 * [what the student sees, what goes into the Python].
 */

export type Options = [string, string][]

/** Icons from `microbit.Image` that are worth a dropdown slot. */
export const ICONS: Options = [
  ['heart', 'HEART'],
  ['small heart', 'HEART_SMALL'],
  ['happy', 'HAPPY'],
  ['smile', 'SMILE'],
  ['sad', 'SAD'],
  ['confused', 'CONFUSED'],
  ['angry', 'ANGRY'],
  ['asleep', 'ASLEEP'],
  ['surprised', 'SURPRISED'],
  ['silly', 'SILLY'],
  ['fabulous', 'FABULOUS'],
  ['meh', 'MEH'],
  ['yes', 'YES'],
  ['no', 'NO'],
  ['triangle', 'TRIANGLE'],
  ['diamond', 'DIAMOND'],
  ['square', 'SQUARE'],
  ['target', 'TARGET'],
  ['arrow N', 'ARROW_N'],
  ['arrow S', 'ARROW_S'],
  ['arrow E', 'ARROW_E'],
  ['arrow W', 'ARROW_W'],
  ['music note', 'MUSIC_QUAVER'],
  ['pitchfork', 'PITCHFORK'],
  ['rabbit', 'RABBIT'],
  ['duck', 'DUCK'],
  ['ghost', 'GHOST'],
  ['skull', 'SKULL'],
  ['umbrella', 'UMBRELLA'],
  ['snake', 'SNAKE'],
]

export const MELODIES: Options = [
  ['dadadadum', 'DADADADUM'],
  ['entertainer', 'ENTERTAINER'],
  ['prelude', 'PRELUDE'],
  ['ode', 'ODE'],
  ['nyan', 'NYAN'],
  ['ringtone', 'RINGTONE'],
  ['funk', 'FUNK'],
  ['blues', 'BLUES'],
  ['birthday', 'BIRTHDAY'],
  ['wedding', 'WEDDING'],
  ['funeral', 'FUNERAL'],
  ['punchline', 'PUNCHLINE'],
  ['python', 'PYTHON'],
  ['baddy', 'BADDY'],
  ['chase', 'CHASE'],
  ['ba ding', 'BA_DING'],
  ['wawawawaa', 'WAWAWAWAA'],
  ['jump up', 'JUMP_UP'],
  ['jump down', 'JUMP_DOWN'],
  ['power up', 'POWER_UP'],
  ['power down', 'POWER_DOWN'],
]

/** The V2 speaker's built-in expressive sounds (`microbit.Sound`). */
export const SOUNDS: Options = [
  ['giggle', 'GIGGLE'],
  ['happy', 'HAPPY'],
  ['hello', 'HELLO'],
  ['mysterious', 'MYSTERIOUS'],
  ['sad', 'SAD'],
  ['slide', 'SLIDE'],
  ['soaring', 'SOARING'],
  ['spring', 'SPRING'],
  ['twinkle', 'TWINKLE'],
  ['yawn', 'YAWN'],
]

export const GESTURES: Options = [
  ['shake', 'shake'],
  ['logo up', 'up'],
  ['logo down', 'down'],
  ['screen up', 'face up'],
  ['screen down', 'face down'],
  ['tilt left', 'left'],
  ['tilt right', 'right'],
  ['free fall', 'freefall'],
]

export const BUTTONS: Options = [
  ['A', 'button_a'],
  ['B', 'button_b'],
]

/** Event buttons: A+B is its own event, as in every other micro:bit editor. */
export const EVENT_BUTTONS: Options = [
  ['A', 'A'],
  ['B', 'B'],
  ['A+B', 'AB'],
]

export const PINS: Options = [
  ['P0', 'pin0'],
  ['P1', 'pin1'],
  ['P2', 'pin2'],
  ['P8', 'pin8'],
  ['P12', 'pin12'],
  ['P13', 'pin13'],
  ['P14', 'pin14'],
  ['P15', 'pin15'],
  ['P16', 'pin16'],
]

export const ANALOG_PINS: Options = [
  ['P0', 'pin0'],
  ['P1', 'pin1'],
  ['P2', 'pin2'],
]

/** Touch works on the three ring pins, plus the gold logo on a V2. */
export const TOUCH_PINS: Options = [...ANALOG_PINS, ['logo (V2)', 'pin_logo']]

export const AXES: Options = [
  ['x', 'x'],
  ['y', 'y'],
  ['z', 'z'],
]

export const NOTES: Options = [
  ['C', 'C4'],
  ['D', 'D4'],
  ['E', 'E4'],
  ['F', 'F4'],
  ['G', 'G4'],
  ['A', 'A4'],
  ['B', 'B4'],
  ['high C', 'C5'],
]
