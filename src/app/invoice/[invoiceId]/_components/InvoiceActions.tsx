'use client';

import React, { useState } from 'react';
import { Download, Printer, Share2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';

interface Props {
  invoiceId:     string;
  invoiceNumber: string;
}

export function InvoiceActions({ invoiceId, invoiceNumber }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [copied,      setCopied]      = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/invoice/pdf?id=${encodeURIComponent(invoiceId)}`);
      if (!res.ok) throw new Error('PDF generation failed');
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const link     = document.createElement('a');
      link.href      = url;
      link.download  = `${invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handleShare() {
    const url = `${window.location.origin}/invoice/${invoiceId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Invoice ${invoiceNumber}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* user cancelled */ }
  }

  return (
    <>
      <Button
        variant="primary"
        size="md"
        leftIcon={downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        onClick={handleDownload}
        disabled={downloading}
      >
        {downloading ? 'Generating…' : 'Download PDF'}
      </Button>
      <Button
        variant="outline"
        size="md"
        leftIcon={<Printer className="size-4" />}
        onClick={handlePrint}
      >
        Print
      </Button>
      <Button
        variant="ghost"
        size="md"
        leftIcon={copied ? <Check className="size-4 text-accent" /> : <Share2 className="size-4" />}
        onClick={handleShare}
      >
        {copied ? 'Copied!' : 'Share'}
      </Button>
    </>
  );
}

export default InvoiceActions;
