'use client';

import React, {
  useId,
  useState,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
} from 'react';
import { ChevronDown, X, Check, Search } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SelectOption {
  value:     string;
  label:     string;
  disabled?: boolean;
}

export interface SelectProps {
  options:          readonly SelectOption[];
  value?:           string | string[];
  onChange?:        (value: string | string[]) => void;
  label?:           string;
  placeholder?:     string;
  error?:           string;
  helperText?:      string;
  searchable?:      boolean;
  multiple?:        boolean;
  disabled?:        boolean;
  required?:        boolean;
  id?:              string;
  className?:       string;
  containerClassName?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Select({
  options,
  value,
  onChange,
  label,
  placeholder      = 'Select…',
  error,
  helperText,
  searchable       = false,
  multiple         = false,
  disabled         = false,
  required         = false,
  id: externalId,
  className        = '',
  containerClassName = '',
}: SelectProps) {
  const uid        = useId();
  const selectId   = externalId ?? `select-${uid}`;
  const listboxId  = `listbox-${uid}`;
  const errorId    = `err-${uid}`;

  const [isOpen,    setIsOpen]    = useState(false);
  const [query,     setQuery]     = useState('');
  const [focused,   setFocused]   = useState(-1);   // keyboard-focused option index
  const [selected,  setSelected]  = useState<string[]>(toArray(value));

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);
  const listRef      = useRef<HTMLUListElement>(null);

  function open()  { if (!disabled) { setIsOpen(true);  setFocused(-1); } }
  function close() { setIsOpen(false); setQuery(''); setFocused(-1); }
  function toggle(){ isOpen ? close() : open(); }

  // Sync with controlled value
  useEffect(() => {
    setSelected(toArray(value));
  }, [value]);

  // Click-outside to close
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchable) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    if (!isOpen) setQuery('');
  }, [isOpen, searchable]);

  const filteredOptions = searchable && query
    ? options.filter(o =>
        o.label.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  const selectOption = useCallback(
    (opt: SelectOption) => {
      if (opt.disabled) return;
      let next: string[];
      if (multiple) {
        next = selected.includes(opt.value)
          ? selected.filter(v => v !== opt.value)
          : [...selected, opt.value];
      } else {
        next = [opt.value];
        close();
      }
      setSelected(next);
      onChange?.(multiple ? next : next[0] ?? '');
    },
    [multiple, selected, onChange]
  );

  function clearAll(e: React.MouseEvent) {
    e.stopPropagation();
    setSelected([]);
    onChange?.(multiple ? [] : '');
  }

  // Scroll focused option into view
  useEffect(() => {
    if (focused >= 0 && listRef.current) {
      const el = listRef.current.children[focused] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [focused]);

  // Keyboard navigation on the trigger
  function handleTriggerKey(e: KeyboardEvent<HTMLButtonElement>) {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        toggle();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) open();
        else setFocused(f => Math.min(f + 1, filteredOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocused(f => Math.max(f - 1, 0));
        break;
      case 'Escape':
        close();
        break;
    }
  }

  // Keyboard navigation inside the list
  function handleListKey(e: KeyboardEvent<HTMLUListElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocused(f => Math.min(f + 1, filteredOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocused(f => Math.max(f - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focused >= 0) selectOption(filteredOptions[focused]);
        break;
      case 'Escape':
        close();
        break;
    }
  }

  // Display text for trigger
  const displayLabel = selected.length === 0
    ? null
    : multiple
      ? `${selected.length} selected`
      : options.find(o => o.value === selected[0])?.label ?? selected[0];

  const isError = !!error;
  const borderCls = isError
    ? 'border-danger'
    : isOpen
      ? 'border-secondary ring-2 ring-secondary/20'
      : 'border-border hover:border-border-strong';

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-1 w-full ${containerClassName}`}
    >
      {/* ── Trigger ──────────────────────────────────────────────────── */}
      <div className="relative">
        <button
          type="button"
          id={selectId}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-required={required || undefined}
          aria-invalid={isError || undefined}
          aria-describedby={isError ? errorId : undefined}
          disabled={disabled}
          onClick={toggle}
          onKeyDown={handleTriggerKey}
          className={[
            'relative flex items-center w-full h-12 px-4 text-left',
            'font-body text-sm bg-card rounded-xl border-2',
            'transition-all duration-150',
            'focus-visible:outline-none',
            'disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60',
            borderCls,
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {/* Floating label */}
          {label && (
            <span
              className={[
                'absolute pointer-events-none select-none',
                'font-body transition-all duration-200 ease-out left-4 z-10',
                displayLabel || isOpen
                  ? 'top-[4px] text-[10px] font-medium ' +
                    (isError
                      ? 'text-danger'
                      : isOpen
                        ? 'text-secondary'
                        : 'text-text-secondary')
                  : 'top-[13px] text-sm text-text-secondary',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {label}
              {required && (
                <span className="text-danger ml-0.5" aria-hidden="true">*</span>
              )}
            </span>
          )}

          {/* Selected value / placeholder */}
          <span
            className={[
              'flex-1 truncate',
              label ? 'pt-4' : '',
              displayLabel ? 'text-text-primary' : 'text-text-disabled',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {displayLabel ?? placeholder}
          </span>

          {/* Clear button */}
          {selected.length > 0 && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear selection"
              onClick={clearAll}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') clearAll(e as unknown as React.MouseEvent);
              }}
              className="mr-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer [&>svg]:size-3.5"
            >
              <X />
            </span>
          )}

          {/* Arrow */}
          <ChevronDown
            className={`size-4 text-text-secondary shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {/* ── Dropdown ───────────────────────────────────────────────── */}
        {isOpen && (
          <div className="absolute z-50 mt-1.5 w-full bg-card border border-border rounded-xl shadow-elevated overflow-hidden animate-scale-in origin-top">
            {/* Search */}
            {searchable && (
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                <Search className="size-3.5 text-text-secondary shrink-0" aria-hidden="true" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setFocused(-1); }}
                  placeholder="Search options…"
                  className="flex-1 text-sm font-body bg-transparent text-text-primary placeholder:text-text-disabled focus:outline-none"
                  aria-label="Search options"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="text-text-secondary hover:text-text-primary"
                    aria-label="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Options list */}
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-multiselectable={multiple}
              onKeyDown={handleListKey}
              tabIndex={-1}
              className="max-h-56 overflow-y-auto py-1 focus:outline-none"
            >
              {filteredOptions.length === 0 ? (
                <li className="px-4 py-3 text-sm text-text-disabled font-body text-center">
                  No options found
                </li>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = selected.includes(opt.value);
                  const isFocusedOpt = focused === idx;
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={opt.disabled}
                      onClick={() => selectOption(opt)}
                      className={[
                        'flex items-center justify-between gap-2',
                        'px-4 py-2.5 text-sm font-body cursor-pointer',
                        'transition-colors duration-100',
                        opt.disabled
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-primary-50',
                        isFocusedOpt ? 'bg-primary-50' : '',
                        isSelected
                          ? 'text-primary font-medium'
                          : 'text-text-primary',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <Check className="size-3.5 text-secondary shrink-0" aria-hidden="true" />
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {isError && (
        <p id={errorId} role="alert" className="flex items-center gap-1 text-danger text-xs font-body animate-slide-down">
          <svg className="size-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {error}
        </p>
      )}

      {/* ── Helper ─────────────────────────────────────────────────────── */}
      {!isError && helperText && (
        <p className="text-text-secondary text-xs font-body">{helperText}</p>
      )}
    </div>
  );
}

export default Select;
