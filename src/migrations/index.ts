import * as migration_20260412_045828_initial_setup from './20260412_045828_initial_setup';
import * as migration_20260711_180904_add_simulators_feedback_forms from './20260711_180904_add_simulators_feedback_forms';

export const migrations = [
  {
    up: migration_20260412_045828_initial_setup.up,
    down: migration_20260412_045828_initial_setup.down,
    name: '20260412_045828_initial_setup',
  },
  {
    up: migration_20260711_180904_add_simulators_feedback_forms.up,
    down: migration_20260711_180904_add_simulators_feedback_forms.down,
    name: '20260711_180904_add_simulators_feedback_forms'
  },
];
