import * as migration_20260412_045828_initial_setup from './20260412_045828_initial_setup';
import * as migration_20260711_180904_add_simulators_feedback_forms from './20260711_180904_add_simulators_feedback_forms';
import * as migration_20260712_005246_add_globals_badges_deadline from './20260712_005246_add_globals_badges_deadline';
import * as migration_20260712_203058_add_native_forms from './20260712_203058_add_native_forms';

export const migrations = [
  {
    up: migration_20260412_045828_initial_setup.up,
    down: migration_20260412_045828_initial_setup.down,
    name: '20260412_045828_initial_setup',
  },
  {
    up: migration_20260711_180904_add_simulators_feedback_forms.up,
    down: migration_20260711_180904_add_simulators_feedback_forms.down,
    name: '20260711_180904_add_simulators_feedback_forms',
  },
  {
    up: migration_20260712_005246_add_globals_badges_deadline.up,
    down: migration_20260712_005246_add_globals_badges_deadline.down,
    name: '20260712_005246_add_globals_badges_deadline',
  },
  {
    up: migration_20260712_203058_add_native_forms.up,
    down: migration_20260712_203058_add_native_forms.down,
    name: '20260712_203058_add_native_forms'
  },
];
