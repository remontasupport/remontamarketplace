'use client'

import { useState } from 'react'
import { BRAND_COLORS } from '@/lib/constants'
import StepCodeOfConductPart1 from './StepCodeOfConductPart1'
import StepCodeOfConductPart2 from './StepCodeOfConductPart2'

interface StepCodeOfConductProps {
  data: {
    codeOfConductPart1Read?: boolean
    codeOfConductSignature?: string | null
    codeOfConductDate?: string | null
    codeOfConductDocument?: {
      id: string
      documentUrl: string
      uploadedAt: string
    } | null
  }
  onChange: (field: string, value: any) => void
  errors?: Record<string, string>
  onPartChange?: (part: number) => void
  part?: number
}

const PARTS = [
  { label: 'Read' },
  { label: 'Sign' },
]

export default function StepCodeOfConduct({ data, onChange, errors = {}, onPartChange, part: partProp }: StepCodeOfConductProps) {
  const [internalPart, setInternalPart] = useState(1)
  const part = partProp ?? internalPart

  const goToPart = (p: number) => {
    setInternalPart(p)
    onPartChange?.(p)
  }

  return (
    <div>
      {/* Stepper */}
      <div className="flex items-center justify-center gap-0 mb-2 px-6 pt-4">
        {PARTS.map((p, i) => {
          const stepNum = i + 1
          const isActive = part === stepNum
          const isDone = part > stepNum

          return (
            <div key={stepNum} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold font-poppins transition-colors"
                  style={{
                    backgroundColor: isActive || isDone ? BRAND_COLORS.PRIMARY : '#E5E7EB',
                    color: isActive || isDone ? '#fff' : '#6B7280',
                  }}
                >
                  {isDone ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : stepNum}
                </div>
                <span className="text-xs font-poppins text-gray-500">{p.label}</span>
              </div>

              {i < PARTS.length - 1 && (
                <div
                  className="h-px w-16 mx-2 mb-4 transition-colors"
                  style={{ backgroundColor: part > 1 ? BRAND_COLORS.PRIMARY : '#E5E7EB' }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Content */}
      {part === 1 ? (
        <>
          <StepCodeOfConductPart1 data={data} onChange={onChange} errors={errors} />
          <div className="flex justify-start px-6 pb-6 -mt-2">
            <button
              type="button"
              onClick={() => goToPart(2)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium font-poppins text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
            >
              Continue to Part 2
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center px-6 pt-2 pb-1">
            <button
              type="button"
              onClick={() => goToPart(1)}
              className="inline-flex items-center gap-1.5 text-sm font-poppins text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Part 1
            </button>
          </div>
          <StepCodeOfConductPart2 data={data} onChange={onChange} errors={errors} />
        </>
      )}
    </div>
  )
}
