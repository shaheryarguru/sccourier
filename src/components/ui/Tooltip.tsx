'use client';

import React, {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content:      React.ReactNode;
  position?:    TooltipPosition;
  delay?:       number;          // ms before showing
  children:     React.ReactElement;
  disabled?:    boolean;
  className?:   string;
}

// ── Arrow direction helpers ───────────────────────────────────────────────────
const PLACEMENT: Record<
  TooltipPosition,
  { tooltip: string; arrow: string }
> = {
  top: {
    tooltip: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    arrow:   'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-[6px] border-t-primary/90',
  },
  bottom: {
    tooltip: 'top-full left-1/2 -translate-x-1/2 mt-2',
    arrow:   'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-[6px] border-b-primary/90',
  },
  left: {
    tooltip: 'right-full top-1/2 -translate-y-1/2 mr-2',
    arrow:   'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-[6px] border-l-primary/90',
  },
  right: {
    tooltip: 'left-full top-1/2 -translate-y-1/2 ml-2',
    arrow:   'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-[6px] border-r-primary/90',
  },
};

// ── Component ─────────────────────────────────────────────────────────────────
export function Tooltip({
  content,
  position  = 'top',
  delay     = 300,
  children,
  disabled  = false,
  className = '',
}: TooltipProps) {
  const uid        = useId();
  const tooltipId  = `tooltip-${uid}`;

  const [visible,    setVisible]    = useState(false);
  const [placement,  setPlacement]  = useState<TooltipPosition>(position);
  const containerRef = useRef<HTMLSpanElement>(null);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (disabled) return;
    timerRef.current = setTimeout(() => {
      // Auto-adjust position based on viewport
      if (containerRef.current) {
        const rect   = containerRef.current.getBoundingClientRect();
        const vw     = window.innerWidth;
        const vh     = window.innerHeight;
        const MARGIN = 80;

        if      (position === 'top'    && rect.top    < MARGIN) setPlacement('bottom');
        else if (position === 'bottom' && rect.bottom > vh - MARGIN) setPlacement('top');
        else if (position === 'left'   && rect.left   < MARGIN) setPlacement('right');
        else if (position === 'right'  && rect.right  > vw - MARGIN) setPlacement('left');
        else setPlacement(position);
      }
      setVisible(true);
    }, delay);
  }, [disabled, delay, position]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  // Clean up timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // Clone child to inject a11y + event props
  const child = isValidElement(children)
    ? cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          show();
          (children.props as React.HTMLAttributes<HTMLElement>).onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
          hide();
          (children.props as React.HTMLAttributes<HTMLElement>).onMouseLeave?.(e);
        },
        onFocus: (e: React.FocusEvent<HTMLElement>) => {
          show();
          (children.props as React.HTMLAttributes<HTMLElement>).onFocus?.(e);
        },
        onBlur: (e: React.FocusEvent<HTMLElement>) => {
          hide();
          (children.props as React.HTMLAttributes<HTMLElement>).onBlur?.(e);
        },
        'aria-describedby': visible ? tooltipId : undefined,
      })
    : children;

  const { tooltip: tooltipCls, arrow: arrowCls } = PLACEMENT[placement];

  return (
    <span ref={containerRef} className="relative inline-flex">
      {child}

      {visible && content && (
        <span
          id={tooltipId}
          role="tooltip"
          className={[
            'absolute z-50 pointer-events-none',
            'max-w-[200px] w-max px-3 py-1.5',
            'bg-primary/90 text-white',
            'text-xs font-body leading-snug rounded-lg',
            'animate-scale-in',
            'whitespace-normal break-words text-center',
            tooltipCls,
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {content}
          {/* Arrow */}
          <span
            className={`absolute w-0 h-0 border-[6px] ${arrowCls}`}
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}

export default Tooltip;
