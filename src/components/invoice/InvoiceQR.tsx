'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface Props {
  /** The full verification URL (https://sccourier.com/invoice/verify?data=...&sig=...) */
  qrUrl:         string;
  invoiceNumber: string;
  /** Size in px — defaults to 120 */
  size?:         number;
}

export function InvoiceQR({ qrUrl, invoiceNumber, size = 120 }: Props) {
  const [imgSrc,  setImgSrc]  = useState<string | null>(null);
  const [error,   setError]   = useState(false);
  const [genTime, setGenTime] = useState<string>('');

  useEffect(() => {
    const now = new Date();
    const gstOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Dubai',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    };
    setGenTime(now.toLocaleString('en-AE', gstOptions) + ' GST');
  }, []);

  useEffect(() => {
    if (!qrUrl) return;
    let cancelled = false;

    import('qrcode').then(QRCode =>
      QRCode.default.toDataURL(qrUrl, {
        width:  size * 2, // 2× for retina
        margin: 1,
        color:  { dark: '#0F2B46', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      })
    ).then(dataUrl => {
      if (!cancelled) setImgSrc(dataUrl);
    }).catch(() => {
      if (!cancelled) setError(true);
    });

    return () => { cancelled = true; };
  }, [qrUrl, size]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-xl border-2 border-primary/20 overflow-hidden bg-white p-2 shadow-sm"
        style={{ width: size + 16, height: size + 16 }}
      >
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={`QR code to verify invoice ${invoiceNumber}`}
            width={size}
            height={size}
            className="rounded-lg"
          />
        ) : error ? (
          <div className="flex items-center justify-center w-full h-full text-text-disabled text-xs font-body text-center p-2">
            QR unavailable
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <Loader2 className="size-6 text-text-disabled animate-spin" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="text-center space-y-0.5">
        <p className="flex items-center gap-1 text-[10px] font-body text-primary justify-center font-bold uppercase tracking-wider">
          <ShieldCheck className="size-3 text-accent" aria-hidden="true" />
          Verify Invoice
        </p>
        <p className="text-[9px] font-mono text-primary font-semibold">{invoiceNumber}</p>
        {genTime && (
          <p className="text-[9px] font-body text-text-disabled">Generated: {genTime}</p>
        )}
      </div>
    </div>
  );
}

export default InvoiceQR;
