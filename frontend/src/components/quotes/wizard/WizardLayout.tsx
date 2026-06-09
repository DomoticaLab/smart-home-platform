import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '../../ui/Button'
import type { WizardStep } from '../../../types/quote.types'

const STEPS: Array<{ number: WizardStep; label: string }> = [
  { number: 1, label: 'Cliente' },
  { number: 2, label: 'Rooms' },
  { number: 3, label: 'Productos' },
  { number: 4, label: 'Resumen' }
]

interface WizardLayoutProps {
  currentStep: WizardStep
  onPrev?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  nextLoading?: boolean
  children: ReactNode
}

export function WizardLayout({
  currentStep,
  onPrev,
  onNext,
  nextLabel = 'Siguiente',
  nextDisabled = false,
  nextLoading = false,
  children
}: WizardLayoutProps) {
  const isFirst = currentStep === 1
  const isLast = currentStep === 4

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, index) => {
          const isDone = currentStep > step.number
          const isActive = currentStep === step.number

          return (
            <div key={step.number} className="flex items-center">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all',
                    isDone
                      ? 'border-gold bg-gold text-bg-primary'
                      : isActive
                        ? 'border-gold bg-gold/20 text-gold'
                        : 'border-border-default bg-bg-secondary text-text-secondary'
                  ].join(' ')}
                >
                  {isDone ? <Check className="h-4 w-4" /> : step.number}
                </div>
                <span
                  className={[
                    'mt-1.5 text-xs font-medium',
                    isActive ? 'text-gold' : 'text-text-secondary'
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={[
                    'mb-5 h-0.5 flex-1 transition-all',
                    currentStep > step.number
                      ? 'bg-gold'
                      : 'bg-border-default'
                  ].join(' ')}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-border-default bg-bg-card p-6">
        {children}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="md"
          onClick={onPrev}
          disabled={isFirst}
          leftIcon={<ChevronLeft className="h-4 w-4" />}
        >
          Anterior
        </Button>

        {!isLast && (
          <Button
            variant="primary"
            size="md"
            onClick={onNext}
            disabled={nextDisabled}
            loading={nextLoading}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  )
}