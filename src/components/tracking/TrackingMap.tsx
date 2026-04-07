'use client';

import React from 'react';
import { MapPin, Circle } from 'lucide-react';

// ── UAE emirate approximate positions (as % of a 600×400 viewBox) ─────────────

const EMIRATE_NODES: Record<string, { cx: number; cy: number; label: string }> = {
  dubai:          { cx: 265, cy: 248, label: 'Dubai'          },
  abu_dhabi:      { cx: 175, cy: 295, label: 'Abu Dhabi'      },
  sharjah:        { cx: 285, cy: 218, label: 'Sharjah'        },
  ajman:          { cx: 297, cy: 200, label: 'Ajman'          },
  ras_al_khaimah: { cx: 330, cy: 148, label: 'RAK'            },
  fujairah:       { cx: 380, cy: 220, label: 'Fujairah'       },
  umm_al_quwain:  { cx: 311, cy: 180, label: 'UAQ'            },
};

// ── Colours ───────────────────────────────────────────────────────────────────

const C = {
  sea:      '#E8F4FD',
  land:     '#F8FAFC',
  landBdr:  '#CBD5E1',
  road:     '#E2E8F0',
  origin:   '#F59E0B',  // amber / secondary
  dest:     '#10B981',  // green / accent
  current:  '#0F2B46',  // navy / primary
  route:    '#0F2B46',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface TrackingMapProps {
  originEmirate?:      string;
  destinationCity?:    string;
  destinationCountry?: string;
  currentLocation?:    string | null;
  /** 0–100 progress along the route */
  routeProgress?:      number;
  className?:          string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(val: string = ''): string {
  return val.toLowerCase().replace(/\s+/g, '_');
}

// Simple lerp for route interpolation
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TrackingMap({
  originEmirate      = 'dubai',
  destinationCity,
  destinationCountry = 'UAE',
  currentLocation,
  routeProgress      = 0,
  className          = '',
}: TrackingMapProps) {
  const originKey  = normalize(originEmirate);
  const origin     = EMIRATE_NODES[originKey] ?? EMIRATE_NODES.dubai;

  // For UAE destinations, try to find the emirate node; fallback to a generic "destination" point
  const isInternational = destinationCountry !== 'UAE';
  const destKey    = normalize(destinationCity ?? '');
  const dest       = isInternational
    ? { cx: 520, cy: 280, label: destinationCountry }   // Off-map right
    : (EMIRATE_NODES[destKey] ?? EMIRATE_NODES.abu_dhabi);

  // Current marker position along the arc
  const t          = Math.min(1, Math.max(0, routeProgress / 100));
  const curX       = lerp(origin.cx, dest.cx, t);
  const curY       = lerp(origin.cy, dest.cy, t) - Math.sin(Math.PI * t) * 24; // arc upwards

  // Bezier control point for curved route line
  const cpX        = (origin.cx + dest.cx) / 2;
  const cpY        = Math.min(origin.cy, dest.cy) - 40;

  const routeD     = `M ${origin.cx} ${origin.cy} Q ${cpX} ${cpY} ${dest.cx} ${dest.cy}`;

  return (
    <div className={['relative rounded-2xl overflow-hidden border border-border bg-white', className].join(' ')}>
      <svg
        viewBox="0 0 600 400"
        className="w-full h-auto"
        role="img"
        aria-label={`Shipment route from ${origin.label} to ${dest.label}`}
      >
        {/* Sea background */}
        <rect width="600" height="400" fill={C.sea} />

        {/* Rough UAE mainland silhouette */}
        <path
          d="M 80 320 L 100 290 L 140 280 L 180 300 L 220 310 L 250 290 L 270 260 L 295 230 L 310 200
             L 325 175 L 345 155 L 365 170 L 390 200 L 400 230 L 385 250 L 370 270
             L 340 290 L 300 310 L 260 320 L 220 330 L 180 335 L 140 330 L 100 325 Z"
          fill={C.land}
          stroke={C.landBdr}
          strokeWidth="1.5"
        />

        {/* Oman border area */}
        <path
          d="M 345 155 L 365 100 L 400 80 L 430 110 L 450 150 L 440 190 L 420 220 L 400 230"
          fill={C.land}
          stroke={C.landBdr}
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />

        {/* Grid lines */}
        {[100, 200, 300, 400, 500].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="400" stroke={C.road} strokeWidth="0.5" />
        ))}
        {[80, 160, 240, 320].map(y => (
          <line key={y} x1="0" y1={y} x2="600" y2={y} stroke={C.road} strokeWidth="0.5" />
        ))}

        {/* Emirate dots + labels */}
        {Object.entries(EMIRATE_NODES).map(([key, node]) => {
          const isOrigin = key === originKey;
          const isDest   = key === destKey && !isInternational;
          if (isOrigin || isDest) return null; // drawn separately
          return (
            <g key={key}>
              <circle cx={node.cx} cy={node.cy} r="3" fill={C.landBdr} />
              <text
                x={node.cx + 6}
                y={node.cy + 4}
                fontSize="8"
                fill="#94A3B8"
                fontFamily="monospace"
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {/* Route dashed line */}
        <path
          d={routeD}
          fill="none"
          stroke={C.route}
          strokeWidth="2"
          strokeDasharray="6 4"
          opacity="0.35"
        />

        {/* Completed route */}
        {t > 0 && (
          <path
            d={`M ${origin.cx} ${origin.cy} Q ${cpX} ${cpY} ${curX} ${curY}`}
            fill="none"
            stroke={C.route}
            strokeWidth="2.5"
            opacity="0.7"
          />
        )}

        {/* International off-screen indicator */}
        {isInternational && (
          <>
            <line x1="450" y1="200" x2="590" y2="200" stroke={C.dest} strokeWidth="1.5" strokeDasharray="4 3" />
            <text x="490" y="190" fontSize="9" fill={C.dest} fontFamily="sans-serif">International</text>
          </>
        )}

        {/* Origin pin */}
        <g transform={`translate(${origin.cx - 8}, ${origin.cy - 20})`}>
          <circle cx="8" cy="8" r="10" fill={C.origin} opacity="0.15" />
          <circle cx="8" cy="8" r="6"  fill={C.origin} />
          <text x="8" y="12" textAnchor="middle" fontSize="7" fill="white" fontFamily="sans-serif">A</text>
        </g>
        <text x={origin.cx} y={origin.cy + 16} textAnchor="middle" fontSize="9" fill={C.origin} fontFamily="sans-serif" fontWeight="bold">
          {origin.label}
        </text>

        {/* Destination pin */}
        <g transform={`translate(${dest.cx - 8}, ${dest.cy - 20})`}>
          <circle cx="8" cy="8" r="10" fill={C.dest} opacity="0.15" />
          <circle cx="8" cy="8" r="6"  fill={C.dest} />
          <text x="8" y="12" textAnchor="middle" fontSize="7" fill="white" fontFamily="sans-serif">B</text>
        </g>
        <text x={dest.cx} y={dest.cy + 16} textAnchor="middle" fontSize="9" fill={C.dest} fontFamily="sans-serif" fontWeight="bold">
          {dest.label}
        </text>

        {/* Current location dot (only if en route) */}
        {t > 0 && t < 1 && (
          <g>
            <circle cx={curX} cy={curY} r="9" fill={C.current} opacity="0.15">
              <animate attributeName="r" values="9;14;9" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={curX} cy={curY} r="6" fill={C.current} />
            <text x={curX} y={curY + 4} textAnchor="middle" fontSize="8" fill="white" fontFamily="sans-serif">▶</text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl border border-border px-3 py-2 flex items-center gap-4 text-xs font-body">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-secondary" />
          Origin
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-accent" />
          Destination
        </span>
        {t > 0 && t < 1 && (
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-primary" />
            {currentLocation ?? 'In Transit'}
          </span>
        )}
      </div>
    </div>
  );
}

export default TrackingMap;
