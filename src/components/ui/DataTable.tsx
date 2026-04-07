'use client';

import React, { useState, useMemo, useId } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import { Skeleton } from './Skeleton';

// ── Types ─────────────────────────────────────────────────────────────────────
export type SortDirection = 'asc' | 'desc';

export interface TableColumn<T extends Record<string, unknown>> {
  /** Property key or custom key */
  key:             string;
  header:          string;
  sortable?:       boolean;
  width?:          string;
  /** Custom renderer. Falls back to string cast of row[key] */
  render?:         (row: T, index: number) => React.ReactNode;
  className?:      string;
  headerClassName?: string;
}

export interface TablePagination {
  page:     number;
  pageSize: number;
  total:    number;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns:        TableColumn<T>[];
  data:           T[];
  /** Field used as React key. Defaults to 'id' */
  keyField?:      string;
  /** Called when a sortable column header is clicked */
  onSort?:        (key: string, direction: SortDirection) => void;
  pagination?:    TablePagination;
  onPageChange?:  (page: number) => void;
  /** Show search bar (client-side filter if onSearch not provided) */
  searchable?:    boolean;
  onSearch?:      (query: string) => void;
  loading?:       boolean;
  emptyMessage?:  string;
  caption?:       string;
  className?:     string;
}

// ── Sort icon ─────────────────────────────────────────────────────────────────
function SortIcon({
  column,
  sortKey,
  sortDir,
}: {
  column:  string;
  sortKey: string | null;
  sortDir: SortDirection;
}) {
  if (sortKey !== column) {
    return <ArrowUpDown className="size-3.5 text-text-disabled opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />;
  }
  return sortDir === 'asc'
    ? <ChevronUp   className="size-3.5 text-secondary" aria-hidden="true" />
    : <ChevronDown className="size-3.5 text-secondary" aria-hidden="true" />;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField    = 'id',
  onSort,
  pagination,
  onPageChange,
  searchable  = false,
  onSearch,
  loading     = false,
  emptyMessage = 'No data found.',
  caption,
  className   = '',
}: DataTableProps<T>) {
  const uid        = useId();
  const [sortKey,  setSortKey]  = useState<string | null>(null);
  const [sortDir,  setSortDir]  = useState<SortDirection>('asc');
  const [query,    setQuery]    = useState('');

  // Client-side search (only when onSearch not provided)
  const filteredData = useMemo(() => {
    if (!searchable || onSearch || !query) return data;
    const q = query.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const val = (row as Record<string, unknown>)[col.key];
        return String(val ?? '').toLowerCase().includes(q);
      })
    );
  }, [data, query, searchable, onSearch, columns]);

  function handleSort(key: string) {
    const nextDir: SortDirection =
      sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDir(nextDir);
    onSort?.(key, nextDir);
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    onSearch?.(val);
  }

  // Pagination helpers
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 1;
  const currentPage = pagination?.page ?? 1;

  function goTo(page: number) {
    if (page < 1 || page > totalPages) return;
    onPageChange?.(page);
  }

  // Page number window: always show up to 5 pages
  const pageWindow = useMemo(() => {
    const half  = 2;
    const start = Math.max(1, currentPage - half);
    const end   = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  // Get cell value
  function getCellValue(col: TableColumn<T>, row: T, rowIdx: number): React.ReactNode {
    if (col.render) return col.render(row, rowIdx);
    const val = (row as Record<string, unknown>)[col.key];
    return val != null ? String(val) : '—';
  }

  const displayData = loading ? [] : filteredData;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* ── Search bar ──────────────────────────────────────────────── */}
      {searchable && (
        <div className="relative max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-secondary pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={handleSearch}
            placeholder="Search…"
            aria-label="Search table"
            className="w-full h-9 pl-9 pr-4 text-sm font-body bg-card border border-border rounded-xl
                       focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20
                       transition-colors placeholder:text-text-disabled"
          />
        </div>
      )}

      {/* ── Table wrapper (horizontal scroll on mobile) ──────────────── */}
      <div className="w-full overflow-x-auto rounded-2xl border border-border shadow-card bg-card">
        <table
          className="w-full border-collapse text-sm font-body"
          aria-label={caption}
          aria-busy={loading}
        >
          {caption && <caption className="sr-only">{caption}</caption>}

          {/* ── Head ──────────────────────────────────────────────────── */}
          <thead>
            <tr className="border-b border-border bg-surface">
              {columns.map((col, colIdx) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === 'asc' ? 'ascending' : 'descending'
                      : col.sortable ? 'none' : undefined
                  }
                  style={{ width: col.width }}
                  className={[
                    'px-4 py-3 text-left font-semibold text-xs text-text-secondary uppercase tracking-wider whitespace-nowrap',
                    colIdx === 0 ? 'sticky left-0 bg-surface z-10' : '',
                    col.sortable ? 'cursor-pointer select-none' : '',
                    col.headerClassName ?? '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="group inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body ──────────────────────────────────────────────────── */}
          <tbody>
            {/* Loading skeleton rows */}
            {loading && (
              Array.from({ length: 5 }).map((_, rowIdx) => (
                <tr key={`skel-${rowIdx}`} className="border-b border-border last:border-0">
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key}
                      className={[
                        'px-4 py-3',
                        colIdx === 0 ? 'sticky left-0 bg-card z-10' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <Skeleton variant="text" width={colIdx === 0 ? '60%' : `${50 + (colIdx * 13) % 40}%`} />
                    </td>
                  ))}
                </tr>
              ))
            )}

            {/* Empty state */}
            {!loading && displayData.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center text-text-secondary font-body"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg className="size-10 text-border" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!loading && displayData.map((row, rowIdx) => {
              const rowKey = String((row as Record<string, unknown>)[keyField] ?? rowIdx);
              return (
                <tr
                  key={rowKey}
                  className="border-b border-border last:border-0 hover:bg-surface/60 transition-colors duration-100"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key}
                      className={[
                        'px-4 py-3 text-text-primary align-middle',
                        colIdx === 0 ? 'sticky left-0 bg-card hover:bg-surface z-10 font-medium' : '',
                        col.className ?? '',
                      ].filter(Boolean).join(' ')}
                    >
                      {getCellValue(col, row, rowIdx)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {pagination && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
          {/* Results summary */}
          <p className="text-xs font-body text-text-secondary shrink-0">
            Showing{' '}
            <span className="font-semibold text-text-primary">
              {Math.min((currentPage - 1) * pagination.pageSize + 1, pagination.total)}
            </span>
            {' '}–{' '}
            <span className="font-semibold text-text-primary">
              {Math.min(currentPage * pagination.pageSize, pagination.total)}
            </span>
            {' '}of{' '}
            <span className="font-semibold text-text-primary">{pagination.total}</span>
            {' '}results
          </p>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            {/* First */}
            <PageBtn
              onClick={() => goTo(1)}
              disabled={currentPage === 1}
              aria-label="First page"
            >
              <ChevronsLeft className="size-3.5" />
            </PageBtn>
            {/* Prev */}
            <PageBtn
              onClick={() => goTo(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-3.5" />
            </PageBtn>

            {/* Page numbers */}
            {pageWindow.map(p => (
              <PageBtn
                key={p}
                onClick={() => goTo(p)}
                active={p === currentPage}
                aria-label={`Page ${p}`}
                aria-current={p === currentPage ? 'page' : undefined}
              >
                {p}
              </PageBtn>
            ))}

            {/* Next */}
            <PageBtn
              onClick={() => goTo(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="size-3.5" />
            </PageBtn>
            {/* Last */}
            <PageBtn
              onClick={() => goTo(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
            >
              <ChevronsRight className="size-3.5" />
            </PageBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page button helper ────────────────────────────────────────────────────────
function PageBtn({
  children,
  onClick,
  disabled,
  active,
  'aria-label': ariaLabel,
  'aria-current': ariaCurrent,
}: {
  children:      React.ReactNode;
  onClick:       () => void;
  disabled?:     boolean;
  active?:       boolean;
  'aria-label'?: string;
  'aria-current'?: 'page' | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      className={[
        'inline-flex items-center justify-center size-7 rounded-lg text-xs font-body font-medium',
        'transition-colors duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        active
          ? 'bg-primary text-white shadow-sm'
          : 'text-text-secondary hover:bg-surface hover:text-text-primary',
      ].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  );
}

export default DataTable;
