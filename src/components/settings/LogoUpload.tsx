'use client';

/**
 * LogoUpload — admin component for uploading/replacing the company invoice logo.
 *
 * Resize logic (client-side, Canvas API):
 *   Target canvas: 300 × 80 px  (landscape, standard invoice header logo)
 *   The image is letterboxed (object-fit: contain) so it never stretches.
 *   Output: PNG blob → sent to /api/settings/logo as multipart/form-data.
 */

import React, { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { Upload, Trash2, Loader2, CheckCircle, AlertCircle, ImageIcon } from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const LOGO_W = 562;   // target width  (px) — matches optimal PDF ratio 562:179
const LOGO_H = 179;   // target height (px)
const MAX_MB  = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resize an image file to LOGO_W × LOGO_H using Canvas.
 * The image is letterboxed (contain) on a transparent background.
 * Returns a PNG Blob.
 */
function resizeToLogoSize(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = LOGO_W;
      canvas.height = LOGO_H;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }

      // Transparent background (keeps logo with transparent BG intact)
      ctx.clearRect(0, 0, LOGO_W, LOGO_H);

      // Calculate letterbox dimensions (contain)
      const scale = Math.min(LOGO_W / img.naturalWidth, LOGO_H / img.naturalHeight);
      const dw = img.naturalWidth  * scale;
      const dh = img.naturalHeight * scale;
      const dx = (LOGO_W - dw) / 2;
      const dy = (LOGO_H - dh) / 2;

      ctx.drawImage(img, dx, dy, dw, dh);

      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
        'image/png',
        1.0,
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface LogoUploadProps {
  currentLogoUrl: string | null;
  onLogoChange: (url: string | null) => void;
}

type UploadState = 'idle' | 'resizing' | 'uploading' | 'success' | 'error';

export function LogoUpload({ currentLogoUrl, onLogoChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview]     = useState<string | null>(currentLogoUrl);
  const [state, setState]         = useState<UploadState>('idle');
  const [errorMsg, setErrorMsg]   = useState<string>('');
  const [isDragging, setDragging] = useState(false);

  const reset = () => { setState('idle'); setErrorMsg(''); };

  const processFile = useCallback(async (file: File) => {
    reset();

    // Basic type guard
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setState('error');
      setErrorMsg('Unsupported format. Use PNG, JPG, WEBP, or SVG.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setState('error');
      setErrorMsg(`File too large (max ${MAX_MB} MB).`);
      return;
    }

    try {
      // Step 1 — resize
      setState('resizing');
      const resized = await resizeToLogoSize(file);

      // Optimistic preview
      const objectUrl = URL.createObjectURL(resized);
      setPreview(objectUrl);

      // Step 2 — upload
      setState('uploading');
      const form = new FormData();
      form.append('file', new File([resized], 'company-logo.png', { type: 'image/png' }));

      const res = await fetch('/api/settings/logo', { method: 'POST', body: form });
      const json = await res.json() as { logo_url?: string; error?: string };

      if (!res.ok || json.error) {
        throw new Error(json.error ?? 'Upload failed');
      }

      setPreview(json.logo_url ?? objectUrl);
      onLogoChange(json.logo_url ?? null);
      setState('success');

      // Auto-reset success badge after 3 s
      setTimeout(() => setState('idle'), 3000);
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
    }
  }, [onLogoChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemove = async () => {
    setState('uploading');
    try {
      await fetch('/api/settings/logo', { method: 'DELETE' });
      setPreview(null);
      onLogoChange(null);
      setState('idle');
    } catch {
      setState('error');
      setErrorMsg('Failed to remove logo');
    }
  };

  const busy = state === 'resizing' || state === 'uploading';

  return (
    <div className="space-y-4">
      {/* Current logo preview */}
      <div className="flex items-start gap-5 flex-wrap">
        <div
          className="relative flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface overflow-hidden"
          style={{ width: 240, height: 64 }}
          aria-label="Logo preview"
        >
          {preview ? (
            <Image
              src={preview}
              alt="Company logo preview"
              fill
              className="object-contain p-2"
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-text-disabled">
              <ImageIcon className="size-6" />
              <span className="text-[10px] font-body">No logo uploaded</span>
            </div>
          )}
        </div>

        <div className="space-y-2 flex-1 min-w-48">
          <p className="text-xs font-body text-text-secondary leading-relaxed">
            Upload your company logo to appear on all generated invoices.
            It will be automatically resized to{' '}
            <span className="font-semibold text-text-primary">{LOGO_W} × {LOGO_H} px</span>{' '}
            (letterboxed, transparent background preserved).
          </p>
          <p className="text-[11px] font-body text-text-disabled">
            Accepted: PNG, JPG, WEBP, SVG · Max {MAX_MB} MB
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-surface'}
          ${busy ? 'pointer-events-none opacity-60' : ''}
        `}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !busy && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload logo"
        onKeyDown={e => e.key === 'Enter' && !busy && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="sr-only"
          onChange={handleFileChange}
          disabled={busy}
        />

        <div className="flex items-center justify-center gap-3 px-5 py-5">
          {busy ? (
            <>
              <Loader2 className="size-5 text-primary animate-spin" />
              <span className="text-sm font-body text-text-secondary">
                {state === 'resizing' ? 'Resizing to 300 × 80 px…' : 'Uploading…'}
              </span>
            </>
          ) : (
            <>
              <Upload className="size-5 text-text-disabled" />
              <span className="text-sm font-body text-text-secondary">
                <span className="font-semibold text-primary">Click to browse</span> or drag &amp; drop
              </span>
            </>
          )}
        </div>
      </div>

      {/* Status messages */}
      {state === 'success' && (
        <div className="flex items-center gap-2 text-emerald-600 text-sm font-body bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
          <CheckCircle className="size-4 shrink-0" />
          Logo uploaded and resized successfully. It will appear on new invoices.
        </div>
      )}
      {state === 'error' && (
        <div className="flex items-center gap-2 text-danger text-sm font-body bg-danger/5 border border-danger/20 rounded-xl px-4 py-2.5">
          <AlertCircle className="size-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Remove button */}
      {preview && !busy && (
        <button
          type="button"
          onClick={handleRemove}
          className="flex items-center gap-1.5 text-xs font-body text-danger hover:text-danger/80 transition-colors"
        >
          <Trash2 className="size-3.5" />
          Remove logo
        </button>
      )}
    </div>
  );
}
