'use client'

import React from 'react'
import { useField } from '@payloadcms/ui'
import type { NumberFieldClientComponent } from 'payload'
import ElasticSlider from '@/components/ElasticSlider'
import { Volume2Icon } from '@/components/animate-ui/icons/Volume2'
import { VolumeOffIcon } from '@/components/animate-ui/icons/VolumeOff'

const AudioSliderField: NumberFieldClientComponent = (props) => {
  const { path, label } = props
  const { value, setValue } = useField<number>({ path })

  // Get field config from props
  const min = props.min ?? 0
  const max = props.max ?? 1
  const step = props.step ?? 0.05

  // Determine which icons to show based on field type
  const isVolumeField = path.includes('volume') || path.includes('mix')
  
  const leftIcon = isVolumeField ? (
    <VolumeOffIcon size={20} className="text-gray-400 dark:text-gray-500" />
  ) : (
    <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">-</span>
  )

  const rightIcon = isVolumeField ? (
    <Volume2Icon size={20} className="text-gray-400 dark:text-gray-500" />
  ) : (
    <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">+</span>
  )

  const handleChange = (newValue: number) => {
    setValue(newValue)
  }

  // Determine decimal places based on range
  const decimalPlaces = max <= 2 ? 2 : 0

  return (
    <div className="field-type-number" style={{ marginBottom: '1.5rem' }}>
      <label className="field-label" style={{ marginBottom: '0.75rem', display: 'block', fontSize: '13px', fontWeight: 600 }}>
        {label || path}
      </label>
      <div style={{ width: '100%', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <ElasticSlider
            defaultValue={value ?? props.defaultValue ?? min}
            startingValue={min}
            maxValue={max}
            stepSize={step}
            isStepped={true}
            leftIcon={leftIcon}
            rightIcon={rightIcon}
            onChange={handleChange}
            decimalPlaces={decimalPlaces}
          />
        </div>
      </div>
    </div>
  )
}

export default AudioSliderField
