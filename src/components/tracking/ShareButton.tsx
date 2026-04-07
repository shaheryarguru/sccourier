'use client';

import { Share2, Check, Link } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui';

interface ShareButtonProps {
  trackingId: string;
  /** Render as a full-width outline Button instead of an icon button */
  asButton?:  boolean;
}

export function ShareButton({ trackingId, asButton = false }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/tracking/${trackingId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Track shipment ${trackingId}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // user cancelled share or clipboard blocked — silently ignore
    }
  }

  if (asButton) {
    return (
      <Button
        type="button"
        variant="outline"
        size="md"
        fullWidth
        leftIcon={copied ? <Check className="size-4 text-accent" /> : <Share2 className="size-4" />}
        onClick={handleShare}
      >
        {copied ? 'Link Copied!' : 'Share Tracking'}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="size-9 flex items-center justify-center rounded-xl border border-border text-text-secondary hover:text-primary hover:border-primary/30 transition-colors"
      aria-label={copied ? 'Link copied!' : 'Share tracking link'}
      title={copied ? 'Link copied!' : 'Share tracking link'}
    >
      {copied
        ? <Check  className="size-4 text-accent" aria-hidden="true" />
        : <Share2 className="size-4"              aria-hidden="true" />
      }
    </button>
  );
}

export default ShareButton;
