import type { CollectionConfig } from 'payload'

export const AudioFiles: CollectionConfig = {
	slug: 'audio-files' as const,
	access: {
		read: () => true,
	},
	admin: {
		useAsTitle: 'title',
		description: 'Upload audio assets used across the site.',
	},
	fields: [
		{
			name: 'title',
			type: 'text',
			required: true,
			label: 'Audio Title',
			admin: {
				description: 'Friendly name to identify this audio file in pickers.',
			},
		},
		{
			name: 'tags',
			type: 'array',
			label: 'Tags',
			admin: {
				description: 'Optional tags to group or search audio files.',
			},
			fields: [
				{
					name: 'tag',
					type: 'text',
					required: true,
				},
			],
		},
	],
	upload: {
		mimeTypes: ['audio/*'],
	},
}

export const Audio: CollectionConfig = {
	slug: 'audio' as const,
	access: {
		read: () => true,
	},
	admin: {
		useAsTitle: 'name',
		description: 'Configure how each sound behaves on the website.',
	},
	fields: [
		{
			name: 'name',
			type: 'text',
			required: true,
			label: 'Audio Name',
			admin: {
				description: 'Friendly name shown in the admin list.',
			},
		},
		{
			name: 'type',
			type: 'select',
			required: true,
			label: 'Use Case',
			options: [
				{ label: 'Button Click', value: 'buttonClick' },
				{ label: 'Mouse Click', value: 'mouseClick' },
				{ label: 'Page Change', value: 'pageChange' },
				{ label: 'Scroll', value: 'scroll' },
				{ label: 'Background / Ambient', value: 'background' },
				{ label: 'Custom', value: 'custom' },
			],
			admin: {
				description: 'Controls where this sound is used in the frontend.',
			},
		},
		{
			name: 'enabled',
			type: 'checkbox',
			label: 'Enabled',
			defaultValue: true,
			admin: {
				position: 'sidebar',
			},
		},
		{
			name: 'volume',
			type: 'number',
			label: 'Volume (0 to 1)',
			required: true,
			defaultValue: 0.3,
			min: 0,
			max: 1,
			admin: {
				step: 0.05,
				position: 'sidebar',
				description: 'Base volume for this sound.',
				components: {
					Field: '@/components/admin/AudioSliderField',
				},
			},
		},
		{
			name: 'loop',
			type: 'checkbox',
			label: 'Loop',
			defaultValue: false,
			admin: {
				position: 'sidebar',
			},
		},
		{
			name: 'playbackRate',
			type: 'number',
			label: 'Playback Speed',
			defaultValue: 1,
			min: 0.5,
			max: 2,
			admin: {
				step: 0.05,
				position: 'sidebar',
				description: '1 = normal speed. Lower is slower, higher is faster.',
				components: {
					Field: '@/components/admin/AudioSliderField',
				},
			},
		},
		{
			name: 'fadeInMs',
			type: 'number',
			label: 'Fade In (ms)',
			defaultValue: 0,
			min: 0,
			max: 5000,
			admin: {
				step: 50,
				components: {
					Field: '@/components/admin/AudioSliderField',
				},
			},
		},
		{
			name: 'fadeOutMs',
			type: 'number',
			label: 'Fade Out (ms)',
			defaultValue: 0,
			min: 0,
			max: 5000,
			admin: {
				step: 50,
				components: {
					Field: '@/components/admin/AudioSliderField',
				},
			},
		},
		{
			name: 'volumeBoost',
			type: 'number',
			label: 'Volume Boost',
			defaultValue: 1,
			min: 0.5,
			max: 2,
			admin: {
				step: 0.05,
				description: 'Optional boost multiplier applied by the frontend.',
				components: {
					Field: '@/components/admin/AudioSliderField',
				},
			},
		},
		{
			name: 'effects',
			type: 'group',
			label: 'Effects',
			fields: [
				{
					name: 'echo',
					type: 'group',
					label: 'Echo',
					fields: [
						{
							name: 'enabled',
							type: 'checkbox',
							defaultValue: false,
						},
						{
							name: 'delayMs',
							type: 'number',
							label: 'Delay (ms)',
							defaultValue: 180,
							min: 10,
							max: 2000,
							admin: { 
								step: 10,
								components: {
									Field: '@/components/admin/AudioSliderField',
								},
							},
						},
						{
							name: 'feedback',
							type: 'number',
							label: 'Feedback (0 to 0.95)',
							defaultValue: 0.35,
							min: 0,
							max: 0.95,
							admin: { 
								step: 0.05,
								components: {
									Field: '@/components/admin/AudioSliderField',
								},
							},
						},
						{
							name: 'mix',
							type: 'number',
							label: 'Mix (0 to 1)',
							defaultValue: 0.25,
							min: 0,
							max: 1,
							admin: { 
								step: 0.05,
								components: {
									Field: '@/components/admin/AudioSliderField',
								},
							},
						},
					],
				},
				{
					name: 'ambience',
					type: 'group',
					label: 'Ambience',
					fields: [
						{
							name: 'enabled',
							type: 'checkbox',
							defaultValue: false,
						},
						{
							name: 'mix',
							type: 'number',
							label: 'Mix (0 to 1)',
							defaultValue: 0.2,
							min: 0,
							max: 1,
							admin: { 
								step: 0.05,
								components: {
									Field: '@/components/admin/AudioSliderField',
								},
							},
						},
						{
							name: 'lowpassHz',
							type: 'number',
							label: 'Lowpass Frequency (Hz)',
							defaultValue: 8000,
							min: 200,
							max: 20000,
							admin: { 
								step: 100,
								components: {
									Field: '@/components/admin/AudioSliderField',
								},
							},
						},
					],
				},
			],
		},
		{
			name: 'sources',
			type: 'array',
			label: 'Audio Sources',
			minRows: 1,
			admin: {
				description: 'Add one or more sources. The frontend can pick randomly.',
			},
			fields: [
				{
					name: 'label',
					type: 'text',
					label: 'Source Label',
				},
				{
					name: 'file',
					type: 'upload',
					relationTo: 'audio-files',
					label: 'Uploaded File',
					validate: (
						value: unknown,
						{ siblingData }: { siblingData?: { externalUrl?: string } },
					) => {
						if (!value && !siblingData?.externalUrl) {
							return 'Upload a file or provide an external URL.'
						}
						return true
					},
				},
				{
					name: 'externalUrl',
					type: 'text',
					label: 'External URL',
					validate: (
						value: unknown,
						{ siblingData }: { siblingData?: { file?: unknown } },
					) => {
						if (!value && !siblingData?.file) {
							return 'Provide an external URL or upload a file.'
						}
						return true
					},
					admin: {
						description: 'Use this for hosted audio (e.g., CDN).',
					},
				},
				{
					name: 'weight',
					type: 'number',
					label: 'Random Weight',
					defaultValue: 1,
					min: 1,
					max: 10,
					admin: {
						step: 1,
						description: 'Higher weight makes this source more likely to be chosen.',
					},
				},
			],
		},
	],
}
