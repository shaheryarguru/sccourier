'use client';

import React, { useId, useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?:              string;
  error?:              string;
  helperText?:         string;
  /** Prefix icon rendered inside the left edge */
  icon?:               React.ReactNode;
  /** Suffix content: icon, text, or button inside the right edge */
  suffix?:             React.ReactNode;
  inputSize?:          'sm' | 'md' | 'lg';
  containerClassName?: string;
}

// ── Size config ───────────────────────────────────────────────────────────────
const SIZE: Record<
  'sm' | 'md' | 'lg',
  { height: string; text: string; labelFloat: string; labelRest: string }
> = {
  sm: {
    height:     'h-10',
    text:       'text-xs',
    labelFloat: 'top-[3px] text-[10px]',
    labelRest:  'top-[11px] text-xs',
  },
  md: {
    height:     'h-12',
    text:       'text-sm',
    labelFloat: 'top-[4px] text-[10px]',
    labelRest:  'top-[13px] text-sm',
  },
  lg: {
    height:     'h-14',
    text:       'text-base',
    labelFloat: 'top-[5px] text-[11px]',
    labelRest:  'top-[17px] text-sm',
  },
};

// ── Component ─────────────────────────────────────────────────────────────────
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      suffix,
      inputSize       = 'md',
      disabled,
      required,
      containerClassName = '',
      className          = '',
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      type            = 'text',
      id: externalId,
      ...props
    },
    ref
  ) => {
    const uid      = useId();
    const inputId  = externalId ?? `input-${uid}`;
    const errorId  = `err-${uid}`;
    const helpId   = `help-${uid}`;

    const [isFocused, setIsFocused] = useState(false);
    const [hasValue,  setHasValue]  = useState(!!defaultValue || !!value);

    // Keep hasValue in sync with controlled value changes
    useEffect(() => {
      if (value !== undefined) setHasValue(!!value);
    }, [value]);

    const isFloating = isFocused || hasValue;
    const isError    = !!error;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      onBlur?.(e);
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      onChange?.(e);
    };

    const { height, text, labelFloat, labelRest } = SIZE[inputSize];

    // Border color responds to state
    const borderCls = isError
      ? 'border-danger'
      : isFocused
        ? 'border-secondary'
        : 'border-border hover:border-border-strong';

    const ariaDescBy = [isError && errorId, helperText && helpId]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className={`flex flex-col gap-1 w-full ${containerClassName}`}>
        {/* ── Input row ──────────────────────────────────────────────── */}
        <div className="relative">
          {/* Prefix icon */}
          {icon && (
            <span
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none [&>svg]:size-4 flex items-center shrink-0 z-10"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            value={value}
            defaultValue={defaultValue}
            disabled={disabled}
            required={required}
            aria-invalid={isError || undefined}
            aria-required={required || undefined}
            aria-describedby={ariaDescBy}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            className={[
              'peer block w-full font-body bg-card rounded-xl',
              'border-2 transition-colors duration-150',
              'focus:outline-none',
              // Hide the default placeholder; floating label fills its role
              'placeholder:opacity-0',
              // Push text down so it sits below the floating label
              'pt-5 pb-1',
              height,
              text,
              // Horizontal padding: leave room for icon / suffix
              icon   ? 'pl-10' : 'pl-4',
              suffix ? 'pr-12' : 'pr-4',
              'disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60',
              borderCls,
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />

          {/* Floating label */}
          {label && (
            <label
              htmlFor={inputId}
              className={[
                'absolute pointer-events-none select-none z-10',
                'font-body font-medium transition-all duration-200 ease-out',
                icon ? 'left-10' : 'left-4',
                isFloating ? labelFloat : labelRest,
                isFloating
                  ? isError
                    ? 'text-danger'
                    : isFocused
                      ? 'text-secondary'
                      : 'text-text-secondary'
                  : 'text-text-secondary',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {label}
              {required && (
                <span className="text-danger ml-0.5" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}

          {/* Suffix */}
          {suffix && (
            <span
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary [&>svg]:size-4 flex items-center shrink-0"
              aria-hidden="true"
            >
              {suffix}
            </span>
          )}
        </div>

        {/* ── Error message ───────────────────────────────────────────── */}
        {isError && (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1 text-danger text-xs font-body animate-slide-down"
          >
            {/* inline error icon */}
            <svg
              className="size-3.5 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0
                   1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1
                   1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {/* ── Helper text ─────────────────────────────────────────────── */}
        {!isError && helperText && (
          <p id={helpId} className="text-text-secondary text-xs font-body">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
