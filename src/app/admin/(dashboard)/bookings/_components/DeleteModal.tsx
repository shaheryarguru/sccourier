'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { Modal, useToast } from '@/components/ui';
import { formatAED } from '@/lib/utils/format';
import type { BookingRow } from '@/lib/types/database';

interface DeleteModalProps {
  booking:  BookingRow | null;
  onClose:  () => void;
  onDeleted: (id: string) => void;
}

export function DeleteModal({ booking, onClose, onDeleted }: DeleteModalProps) {
  const [confirmed, setConfirmed]   = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const { success, error: toastError } = useToast();

  // Reset checkbox when modal opens/closes
  React.useEffect(() => { setConfirmed(false); }, [booking]);

  async function handleDelete() {
    if (!booking || !confirmed) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/booking/${booking.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        toastError('Delete failed', json.message ?? 'Could not delete booking');
        return;
      }
      success('Booking deleted', `${booking.booking_number} has been soft-deleted`);
      onDeleted(booking.id);
    } catch {
      toastError('Delete failed', 'Network error — please try again');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      isOpen={!!booking}
      onClose={onClose}
      title="Delete Booking"
      size="md"
      noBackdropClose
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-body font-medium bg-surface border border-border text-text-primary px-4 py-2 rounded-xl hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!confirmed || deleting}
            className="flex items-center gap-1.5 text-sm font-body font-semibold bg-danger text-white px-4 py-2 rounded-xl hover:bg-danger/90 disabled:opacity-40 transition-colors"
          >
            {deleting && <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" />}
            <Trash2 className="size-3.5" aria-hidden="true" />
            {deleting ? 'Deleting…' : 'Delete Permanently'}
          </button>
        </>
      }
    >
      {booking && (
        <div className="space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-3 bg-danger/5 border border-danger/20 rounded-xl p-4">
            <AlertTriangle className="size-5 text-danger shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-body font-semibold text-danger text-sm">Are you sure you want to delete this booking?</p>
              <p className="text-xs font-body text-text-secondary mt-1">
                This is a soft delete — the booking will be hidden but can be restored later from the &ldquo;Show Deleted&rdquo; view.
              </p>
            </div>
          </div>

          {/* Booking summary */}
          <div className="bg-surface rounded-xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-body text-text-secondary">Booking #</span>
              <span className="font-mono text-xs font-semibold text-primary">{booking.booking_number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-body text-text-secondary">Tracking ID</span>
              <span className="font-mono text-xs text-text-primary">{booking.tracking_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-body text-text-secondary">Route</span>
              <span className="text-xs font-body text-text-primary">{booking.sender_name} → {booking.receiver_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-body text-text-secondary">Amount</span>
              <span className="text-xs font-body font-semibold text-text-primary">{formatAED(booking.total_amount)}</span>
            </div>
          </div>

          {/* What gets hidden */}
          <div className="space-y-1">
            <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wide">This will hide:</p>
            <ul className="space-y-1 text-xs font-body text-text-secondary list-disc list-inside">
              <li>The booking record</li>
              <li>Tracking events remain accessible (public tracking still works)</li>
              <li>Associated invoices remain in the system</li>
            </ul>
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-danger"
            />
            <span className="text-sm font-body text-text-primary">I understand this booking will be hidden</span>
          </label>
        </div>
      )}
    </Modal>
  );
}
