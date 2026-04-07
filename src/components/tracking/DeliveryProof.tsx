'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, Camera, PenLine, User, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/format';
import type { TrackingEventRow } from '@/lib/types/database';

interface Props {
  /** The tracking event that represents delivery (status === 'delivered') */
  deliveryEvent: TrackingEventRow | null;
  receiverName:  string;
}

function ProofImage({ src, label }: { src: string; label: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="group relative w-full aspect-video rounded-xl overflow-hidden border border-border bg-surface hover:border-primary/30 transition-colors"
        aria-label={`View ${label} full size`}
      >
        <Image
          src={src}
          alt={label}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="absolute bottom-2 left-2 text-xs font-body text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          Click to enlarge
        </p>
      </button>

      {/* Lightbox */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
          role="dialog"
          aria-label={label}
          aria-modal
        >
          <div className="relative max-w-2xl w-full max-h-[90vh]">
            <Image
              src={src}
              alt={label}
              width={800}
              height={600}
              className="object-contain rounded-xl w-full h-auto"
            />
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="absolute top-2 right-2 size-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function DeliveryProof({ deliveryEvent, receiverName }: Props) {
  if (!deliveryEvent) return null;

  const hasPhoto     = !!deliveryEvent.photo_url;
  const hasSignature = !!deliveryEvent.signature_url;
  if (!hasPhoto && !hasSignature) return null;

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-accent/5 flex items-center gap-3">
        <div className="size-8 rounded-full bg-accent/20 flex items-center justify-center">
          <CheckCircle2 className="size-4 text-accent" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-body font-semibold text-accent">Delivered Successfully</p>
          {deliveryEvent.event_timestamp && (
            <p className="text-xs font-body text-text-secondary flex items-center gap-1 mt-0.5">
              <Clock className="size-3" aria-hidden="true" />
              {formatDateTime(deliveryEvent.event_timestamp)}
            </p>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Delivered to */}
        <div className="flex items-center gap-2 text-sm font-body">
          <User className="size-4 text-text-disabled shrink-0" aria-hidden="true" />
          <span className="text-text-secondary">Received by</span>
          <span className="text-text-primary font-semibold">{receiverName}</span>
        </div>

        {/* Location */}
        {deliveryEvent.location && (
          <p className="text-xs font-body text-text-secondary">
            Location: {deliveryEvent.location}
          </p>
        )}

        {/* Notes */}
        {deliveryEvent.notes && (
          <p className="text-sm font-body text-text-secondary italic border-l-2 border-border pl-3">
            &ldquo;{deliveryEvent.notes}&rdquo;
          </p>
        )}

        {/* Proof images */}
        <div className={['grid gap-4', hasPhoto && hasSignature ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'].join(' ')}>
          {hasPhoto && (
            <div className="space-y-1.5">
              <p className="text-xs font-body font-semibold text-text-disabled uppercase tracking-wider flex items-center gap-1">
                <Camera className="size-3" aria-hidden="true" />
                Delivery Photo
              </p>
              <ProofImage src={deliveryEvent.photo_url!} label="Delivery photo" />
            </div>
          )}
          {hasSignature && (
            <div className="space-y-1.5">
              <p className="text-xs font-body font-semibold text-text-disabled uppercase tracking-wider flex items-center gap-1">
                <PenLine className="size-3" aria-hidden="true" />
                Recipient Signature
              </p>
              <ProofImage src={deliveryEvent.signature_url!} label="Recipient signature" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeliveryProof;
