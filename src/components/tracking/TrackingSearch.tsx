'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, X, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui';
import { MAX_MULTI_TRACK } from '@/lib/utils/constants';

const LS_KEY = 'scc_recent_tracking';
const MAX_RECENT = 6;

function getRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveRecent(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    // Deduplicate, keep most recent first, max MAX_RECENT
    const unique = [...new Set(ids.filter(Boolean))].slice(0, MAX_RECENT);
    localStorage.setItem(LS_KEY, JSON.stringify(unique));
  } catch { /* ignore */ }
}

function addToRecent(newIds: string[]) {
  const existing = getRecent();
  const merged   = [...newIds, ...existing.filter(r => !newIds.includes(r))];
  saveRecent(merged);
}

export function TrackingSearch() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const initial      = searchParams.get('ids')?.split(',').filter(Boolean) ?? [''];

  const [ids,    setIds]    = useState<string[]>(initial.length ? initial : ['']);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(getRecent());
  }, []);

  function updateId(i: number, val: string) {
    setIds(prev => prev.map((v, idx) => idx === i ? val.toUpperCase() : v));
  }

  function addRow() {
    if (ids.length < MAX_MULTI_TRACK) setIds(prev => [...prev, '']);
  }

  function removeRow(i: number) {
    setIds(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : ['']);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const filled = ids.map(s => s.trim().toUpperCase()).filter(Boolean);
    if (!filled.length) return;
    addToRecent(filled);
    setRecent(getRecent());
    if (filled.length === 1) {
      router.push(`/tracking/${encodeURIComponent(filled[0])}`);
    } else {
      router.push(`/tracking?ids=${filled.map(encodeURIComponent).join(',')}`);
    }
  }

  function trackRecent(id: string) {
    addToRecent([id]);
    setRecent(getRecent());
    router.push(`/tracking/${encodeURIComponent(id)}`);
  }

  function removeFromRecent(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next = recent.filter(r => r !== id);
    setRecent(next);
    saveRecent(next);
  }

  // Paste handler: split by common delimiters (space, comma, newline)
  function handlePaste(i: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const text  = e.clipboardData.getData('text');
    const parts = text.split(/[\s,;\n]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
    if (parts.length <= 1) return; // let normal paste handle single IDs
    e.preventDefault();
    const newIds = [...ids];
    newIds[i] = parts[0];
    const remaining = parts.slice(1).filter(Boolean);
    const combined  = [...newIds, ...remaining].slice(0, MAX_MULTI_TRACK);
    setIds(combined);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="space-y-3" role="search" aria-label="Track shipment">
        {ids.map((id, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-text-disabled pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={id}
                onChange={e => updateId(i, e.target.value)}
                onPaste={e => handlePaste(i, e)}
                placeholder="SC29030001"
                aria-label={`Tracking ID ${i + 1}`}
                autoComplete="off"
                spellCheck={false}
                className="w-full h-12 pl-10 pr-4 font-mono text-sm bg-white border border-border rounded-xl
                           focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20
                           transition-colors placeholder:text-text-disabled text-primary uppercase"
              />
            </div>
            {ids.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(i)}
                aria-label={`Remove row ${i + 1}`}
                className="size-12 flex items-center justify-center rounded-xl border border-border text-text-disabled
                           hover:text-danger hover:border-danger/30 transition-colors shrink-0"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}

        <div className="flex items-center gap-3">
          {ids.length < MAX_MULTI_TRACK && (
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1.5 text-sm font-body text-secondary hover:text-secondary/80 transition-colors"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add another
            </button>
          )}
          <Button
            type="submit"
            variant="primary"
            size="md"
            rightIcon={<ArrowRight />}
            className="ml-auto"
            disabled={!ids.some(Boolean)}
          >
            {ids.filter(Boolean).length > 1 ? 'Track All' : 'Track Shipment'}
          </Button>
        </div>
      </form>

      {/* Recent searches */}
      {recent.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-body font-semibold text-text-disabled uppercase tracking-wider mb-2">
            <Clock className="size-3" aria-hidden="true" />
            Recent
          </p>
          <div className="flex flex-wrap gap-2">
            {recent.map(id => (
              <button
                key={id}
                type="button"
                onClick={() => trackRecent(id)}
                className="group flex items-center gap-1.5 pl-3 pr-1 py-1.5 rounded-lg border border-border bg-white
                           hover:border-primary/30 hover:bg-primary/[0.03] transition-all text-xs font-mono font-semibold text-text-primary"
              >
                {id}
                <span
                  role="button"
                  aria-label={`Remove ${id} from recent`}
                  className="size-4 flex items-center justify-center rounded-md text-text-disabled hover:text-danger hover:bg-red-50 transition-colors"
                  onClick={e => removeFromRecent(id, e)}
                >
                  <X className="size-3" aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TrackingSearch;
