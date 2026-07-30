import * as migration_20260412_045828_initial_setup from './20260412_045828_initial_setup';
import * as migration_20260711_180904_add_simulators_feedback_forms from './20260711_180904_add_simulators_feedback_forms';
import * as migration_20260712_005246_add_globals_badges_deadline from './20260712_005246_add_globals_badges_deadline';
import * as migration_20260712_203058_add_native_forms from './20260712_203058_add_native_forms';
import * as migration_20260713_120901_admin_qol_batch from './20260713_120901_admin_qol_batch';
import * as migration_20260713_130000_gallery_photos_captions from './20260713_130000_gallery_photos_captions';
import * as migration_20260728_100000_remove_audio from './20260728_100000_remove_audio';
import * as migration_20260728_110000_learning_split from './20260728_110000_learning_split';
import * as migration_20260728_120000_gallery_uploads from './20260728_120000_gallery_uploads';
import * as migration_20260728_130000_add_projects from './20260728_130000_add_projects';
import * as migration_20260728_140000_forms_rework from './20260728_140000_forms_rework';
import * as migration_20260728_150000_form_sheet_id from './20260728_150000_form_sheet_id';
import * as migration_20260730_100000_certificate_drive_template from './20260730_100000_certificate_drive_template';
import * as migration_20260730_110000_certificate_batches from './20260730_110000_certificate_batches';
import * as migration_20260730_120000_certificate_customization from './20260730_120000_certificate_customization';

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
    name: '20260712_203058_add_native_forms',
  },
  {
    up: migration_20260713_120901_admin_qol_batch.up,
    down: migration_20260713_120901_admin_qol_batch.down,
    name: '20260713_120901_admin_qol_batch'
  },
  {
    up: migration_20260713_130000_gallery_photos_captions.up,
    down: migration_20260713_130000_gallery_photos_captions.down,
    name: '20260713_130000_gallery_photos_captions',
  },
  {
    up: migration_20260728_100000_remove_audio.up,
    down: migration_20260728_100000_remove_audio.down,
    name: '20260728_100000_remove_audio',
  },
  {
    up: migration_20260728_110000_learning_split.up,
    down: migration_20260728_110000_learning_split.down,
    name: '20260728_110000_learning_split',
  },
  {
    up: migration_20260728_120000_gallery_uploads.up,
    down: migration_20260728_120000_gallery_uploads.down,
    name: '20260728_120000_gallery_uploads',
  },
  {
    up: migration_20260728_130000_add_projects.up,
    down: migration_20260728_130000_add_projects.down,
    name: '20260728_130000_add_projects',
  },
  {
    up: migration_20260728_140000_forms_rework.up,
    down: migration_20260728_140000_forms_rework.down,
    name: '20260728_140000_forms_rework',
  },
  {
    up: migration_20260728_150000_form_sheet_id.up,
    down: migration_20260728_150000_form_sheet_id.down,
    name: '20260728_150000_form_sheet_id',
  },
  {
    up: migration_20260730_100000_certificate_drive_template.up,
    down: migration_20260730_100000_certificate_drive_template.down,
    name: '20260730_100000_certificate_drive_template',
  },
  {
    up: migration_20260730_110000_certificate_batches.up,
    down: migration_20260730_110000_certificate_batches.down,
    name: '20260730_110000_certificate_batches',
  },
  {
    up: migration_20260730_120000_certificate_customization.up,
    down: migration_20260730_120000_certificate_customization.down,
    name: '20260730_120000_certificate_customization',
  },
];
