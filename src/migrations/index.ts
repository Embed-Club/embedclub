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
import * as migration_20260803_100000_video_and_drawio_blocks from './20260803_100000_video_and_drawio_blocks';
import * as migration_20260803_110000_drizzle_snapshot_baseline from './20260803_110000_drizzle_snapshot_baseline';
import * as migration_20260803_133059_add_coming_soon_badge from './20260803_133059_add_coming_soon_badge';
import * as migration_20260803_170606_add_accordion_block from './20260803_170606_add_accordion_block';
import * as migration_20260812_064517_addFormMediaAndUploads from './20260812_064517_addFormMediaAndUploads';
import * as migration_20260814_005629_addCertificatePlaceholders from './20260814_005629_addCertificatePlaceholders';
import * as migration_20260814_081142_dropLegacyCertificateDownload from './20260814_081142_dropLegacyCertificateDownload';
import * as migration_20260814_175548_addFormSections from './20260814_175548_addFormSections';
import * as migration_20260814_184315_addGoogleImportProvenance from './20260814_184315_addGoogleImportProvenance';
import * as migration_20260814_200026_addPerPersonCertificateValues from './20260814_200026_addPerPersonCertificateValues';
import * as migration_20260815_072559_dropProjectStatus from './20260815_072559_dropProjectStatus';
import * as migration_20260815_120641_addProjectAwardFields from './20260815_120641_addProjectAwardFields';
import * as migration_20260815_162712_dropProjectOrder from './20260815_162712_dropProjectOrder';
import * as migration_20260815_183351_addMemberCategoryBatchOrder from './20260815_183351_addMemberCategoryBatchOrder';
import * as migration_20260816_080041_addMemberGender from './20260816_080041_addMemberGender';
import * as migration_20260817_063713_addLegalPagesAndFormConsent from './20260817_063713_addLegalPagesAndFormConsent';
import * as migration_20260817_164758_addLegalPageSections from './20260817_164758_addLegalPageSections';
import * as migration_20260817_201946_addUsnFieldRole from './20260817_201946_addUsnFieldRole';
import * as migration_20260819_002946_addSupportPages from './20260819_002946_addSupportPages';
import * as migration_20260819_050734_addSupportFaq from './20260819_050734_addSupportFaq';
import * as migration_20260819_053658_dropSupportPageFields from './20260819_053658_dropSupportPageFields';
import * as migration_20260819_100524_addSimulatorLaunchType from './20260819_100524_addSimulatorLaunchType';
import * as migration_20260821_120000_allow_form_deletion from './20260821_120000_allow_form_deletion';
import * as migration_20260826_193506_add_achievement_settings from './20260826_193506_add_achievement_settings';

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
    name: '20260713_120901_admin_qol_batch',
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
  {
    up: migration_20260803_100000_video_and_drawio_blocks.up,
    down: migration_20260803_100000_video_and_drawio_blocks.down,
    name: '20260803_100000_video_and_drawio_blocks',
  },
  {
    up: migration_20260803_110000_drizzle_snapshot_baseline.up,
    down: migration_20260803_110000_drizzle_snapshot_baseline.down,
    name: '20260803_110000_drizzle_snapshot_baseline',
  },
  {
    up: migration_20260803_133059_add_coming_soon_badge.up,
    down: migration_20260803_133059_add_coming_soon_badge.down,
    name: '20260803_133059_add_coming_soon_badge',
  },
  {
    up: migration_20260803_170606_add_accordion_block.up,
    down: migration_20260803_170606_add_accordion_block.down,
    name: '20260803_170606_add_accordion_block',
  },
  {
    up: migration_20260812_064517_addFormMediaAndUploads.up,
    down: migration_20260812_064517_addFormMediaAndUploads.down,
    name: '20260812_064517_addFormMediaAndUploads',
  },
  {
    up: migration_20260814_005629_addCertificatePlaceholders.up,
    down: migration_20260814_005629_addCertificatePlaceholders.down,
    name: '20260814_005629_addCertificatePlaceholders',
  },
  {
    up: migration_20260814_081142_dropLegacyCertificateDownload.up,
    down: migration_20260814_081142_dropLegacyCertificateDownload.down,
    name: '20260814_081142_dropLegacyCertificateDownload',
  },
  {
    up: migration_20260814_175548_addFormSections.up,
    down: migration_20260814_175548_addFormSections.down,
    name: '20260814_175548_addFormSections',
  },
  {
    up: migration_20260814_184315_addGoogleImportProvenance.up,
    down: migration_20260814_184315_addGoogleImportProvenance.down,
    name: '20260814_184315_addGoogleImportProvenance',
  },
  {
    up: migration_20260814_200026_addPerPersonCertificateValues.up,
    down: migration_20260814_200026_addPerPersonCertificateValues.down,
    name: '20260814_200026_addPerPersonCertificateValues',
  },
  {
    up: migration_20260815_072559_dropProjectStatus.up,
    down: migration_20260815_072559_dropProjectStatus.down,
    name: '20260815_072559_dropProjectStatus',
  },
  {
    up: migration_20260815_120641_addProjectAwardFields.up,
    down: migration_20260815_120641_addProjectAwardFields.down,
    name: '20260815_120641_addProjectAwardFields',
  },
  {
    up: migration_20260815_162712_dropProjectOrder.up,
    down: migration_20260815_162712_dropProjectOrder.down,
    name: '20260815_162712_dropProjectOrder',
  },
  {
    up: migration_20260815_183351_addMemberCategoryBatchOrder.up,
    down: migration_20260815_183351_addMemberCategoryBatchOrder.down,
    name: '20260815_183351_addMemberCategoryBatchOrder',
  },
  {
    up: migration_20260816_080041_addMemberGender.up,
    down: migration_20260816_080041_addMemberGender.down,
    name: '20260816_080041_addMemberGender',
  },
  {
    up: migration_20260817_063713_addLegalPagesAndFormConsent.up,
    down: migration_20260817_063713_addLegalPagesAndFormConsent.down,
    name: '20260817_063713_addLegalPagesAndFormConsent',
  },
  {
    up: migration_20260817_164758_addLegalPageSections.up,
    down: migration_20260817_164758_addLegalPageSections.down,
    name: '20260817_164758_addLegalPageSections',
  },
  {
    up: migration_20260817_201946_addUsnFieldRole.up,
    down: migration_20260817_201946_addUsnFieldRole.down,
    name: '20260817_201946_addUsnFieldRole',
  },
  {
    up: migration_20260819_002946_addSupportPages.up,
    down: migration_20260819_002946_addSupportPages.down,
    name: '20260819_002946_addSupportPages',
  },
  {
    up: migration_20260819_050734_addSupportFaq.up,
    down: migration_20260819_050734_addSupportFaq.down,
    name: '20260819_050734_addSupportFaq',
  },
  {
    up: migration_20260819_053658_dropSupportPageFields.up,
    down: migration_20260819_053658_dropSupportPageFields.down,
    name: '20260819_053658_dropSupportPageFields',
  },
  {
    up: migration_20260819_100524_addSimulatorLaunchType.up,
    down: migration_20260819_100524_addSimulatorLaunchType.down,
    name: '20260819_100524_addSimulatorLaunchType',
  },
  {
    up: migration_20260821_120000_allow_form_deletion.up,
    down: migration_20260821_120000_allow_form_deletion.down,
    name: '20260821_120000_allow_form_deletion',
  },
  {
    up: migration_20260826_193506_add_achievement_settings.up,
    down: migration_20260826_193506_add_achievement_settings.down,
    name: '20260826_193506_add_achievement_settings'
  },
];
