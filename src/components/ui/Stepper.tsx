'use client';

import React from 'react';
import { Check } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface StepperStep {
  label:        string;
  description?: string;
}

export type StepStatus = 'completed' | 'current' | 'upcoming';

export interface StepperProps {
  steps:          StepperStep[];
  /** 0-indexed current step */
  currentStep:    number;
  onStepClick?:   (index: number) => void;
  /** Allow clicking completed steps to go back */
  allowBack?:     boolean;
  className?:     string;
}

// ── Step status helper ────────────────────────────────────────────────────────
function getStatus(idx: number, current: number): StepStatus {
  if (idx < current)  return 'completed';
  if (idx === current) return 'current';
  return 'upcoming';
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Stepper({
  steps,
  currentStep,
  onStepClick,
  allowBack  = true,
  className  = '',
}: StepperProps) {
  return (
    <nav
      aria-label="Progress"
      className={`w-full ${className}`}
    >
      <ol className="flex items-start md:items-center w-full">
        {steps.map((step, idx) => {
          const status     = getStatus(idx, currentStep);
          const isLast     = idx === steps.length - 1;
          const isClickable =
            !!onStepClick && (status === 'completed' ? allowBack : false);

          return (
            <li
              key={idx}
              className={`flex ${isLast ? 'flex-none' : 'flex-1'} items-start md:items-center`}
              aria-current={status === 'current' ? 'step' : undefined}
            >
              {/* ── Step node + label ──────────────────────────────────── */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(idx)}
                disabled={!isClickable}
                aria-label={`Step ${idx + 1}: ${step.label}${status === 'completed' ? ' (completed)' : status === 'current' ? ' (current)' : ''}`}
                className={[
                  'flex flex-col items-center gap-1.5 group',
                  'focus-visible:outline-none',
                  isClickable ? 'cursor-pointer' : 'cursor-default',
                  // on mobile show column, on md+ show row
                  'w-auto',
                ].join(' ')}
              >
                {/* Circle / Check */}
                <span
                  className={[
                    'flex items-center justify-center',
                    'size-9 rounded-full font-heading font-bold text-sm',
                    'transition-all duration-200 shrink-0',
                    'ring-2 ring-offset-2',
                    status === 'completed'
                      ? 'bg-primary text-white ring-primary/40 group-hover:bg-primary-dark'
                      : status === 'current'
                        ? 'bg-secondary text-primary ring-secondary/40 shadow-[0_4px_14px_rgb(245_158_11/0.3)]'
                        : 'bg-card text-text-disabled ring-border group-hover:ring-border-strong',
                  ].join(' ')}
                >
                  {status === 'completed' ? (
                    <Check className="size-4.5" aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">{idx + 1}</span>
                  )}
                </span>

                {/* Label — hidden on mobile for space, visible md+ */}
                <span className="hidden md:flex flex-col items-center text-center max-w-[120px]">
                  <span
                    className={[
                      'text-xs font-body font-semibold leading-tight',
                      status === 'current'
                        ? 'text-secondary'
                        : status === 'completed'
                          ? 'text-primary'
                          : 'text-text-disabled',
                    ].join(' ')}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="text-[10px] font-body text-text-disabled mt-0.5 leading-tight">
                      {step.description}
                    </span>
                  )}
                </span>

                {/* Mobile: step number label only */}
                <span
                  className={[
                    'md:hidden text-[10px] font-body font-medium leading-tight',
                    status === 'current'   ? 'text-secondary'
                    : status === 'completed' ? 'text-primary'
                    : 'text-text-disabled',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {idx + 1}
                </span>
              </button>

              {/* ── Connector line (not shown after last step) ─────────── */}
              {!isLast && (
                <div className="flex-1 flex items-center justify-center px-2 mt-[1.125rem] md:mt-0">
                  <div
                    className={[
                      'h-[2px] w-full rounded-full transition-all duration-300',
                      idx < currentStep
                        ? 'bg-primary'         // completed connector
                        : 'bg-border',         // upcoming: dashed via CSS trick
                    ].join(' ')}
                    style={
                      idx >= currentStep
                        ? {
                            backgroundImage:
                              'repeating-linear-gradient(90deg, #E2E8F0 0, #E2E8F0 6px, transparent 6px, transparent 12px)',
                            backgroundSize: '12px 2px',
                            backgroundColor: 'transparent',
                          }
                        : undefined
                    }
                    aria-hidden="true"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: current step label shown below */}
      <div className="md:hidden mt-3 text-center">
        {steps[currentStep] && (
          <>
            <p className="text-sm font-body font-semibold text-primary">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].label}
            </p>
            {steps[currentStep].description && (
              <p className="text-xs font-body text-text-secondary mt-0.5">
                {steps[currentStep].description}
              </p>
            )}
          </>
        )}
      </div>
    </nav>
  );
}

export default Stepper;
