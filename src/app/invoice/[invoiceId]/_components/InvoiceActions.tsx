'use client';

import React, { useState, useEffect } from 'react';
import { Download, Printer, Share2, Check, Loader2 } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import type { InvoiceRow, BookingRow } from '@/lib/types/database';
import { slugToLabel } from '@/lib/utils/format';

interface Props {
  invoice:  InvoiceRow;
  booking?: BookingRow | null;
}

// Code39 Barcode Encoding Table for PDF generation
const Code39Table: Record<string, string> = {
  '0': 'n n n w w n w n n',
  '1': 'w n n w n n n n w',
  '2': 'n n w w n n n n w',
  '3': 'w n w w n n n n n',
  '4': 'n n n w w n n n w',
  '5': 'w n n w w n n n n',
  '6': 'n n w w w n n n n',
  '7': 'n n n w n n w n w',
  '8': 'w n n w n n w n n',
  '9': 'n n w w n n w n n',
  'A': 'w n n n n w n n w',
  'B': 'n n w n n w n n w',
  'C': 'w n w n n w n n n',
  'D': 'n n n n w w n n w',
  'E': 'w n n n w w n n n',
  'F': 'n n w n w w n n n',
  'G': 'n n n n n w w n w',
  'H': 'w n n n n w w n n',
  'I': 'n n w n n w w n n',
  'J': 'n n n n w w w n n',
  'K': 'w n n n n n n w w',
  'L': 'n n w n n n n w w',
  'M': 'w n w n n n n w n',
  'N': 'n n n n w n n w w',
  'O': 'w n n n w n n w n',
  'P': 'n n w n w n n w n',
  'Q': 'n n n n n n w w w',
  'R': 'w n n n n n w w n',
  'S': 'n n w n n n w w n',
  'T': 'n n n n w n w w n',
  'U': 'w w n n n n n n w',
  'V': 'n w w n n n n n w',
  'W': 'w w w n n n n n n',
  'X': 'n w n n w n n n w',
  'Y': 'w w n n w n n n n',
  'Z': 'n w w n n w n n n',
  '-': 'n w n n n n w n w',
  '.': 'w w n n n n w n n',
  ' ': 'n w w n n n w n n',
  '*': 'n w n n w n w n n',
  '$': 'n w n w n w n n n',
  '/': 'n w n w n n n w n',
  '+': 'n w n n n w n w n',
  '%': 'n n n w n w n w n'
};

// Draw Code39 Barcode using native jsPDF rects
function drawCode39(doc: any, text: string, x: number, y: number, height: number, narrowWidth: number = 0.22, wideFactor: number = 2.5) {
  const code = `*${text.toUpperCase()}*`;
  let currentX = x;
  const wideWidth = narrowWidth * wideFactor;
  const interCharacterGap = narrowWidth;

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const pattern = Code39Table[char] || Code39Table[' '];
    const bars = pattern.split(' ');

    for (let j = 0; j < bars.length; j++) {
      const isBlack = (j % 2 === 0);
      const isWide = (bars[j] === 'w');
      const w = isWide ? wideWidth : narrowWidth;

      if (isBlack) {
        doc.setFillColor(0, 0, 0);
        doc.rect(currentX, y, w, height, 'F');
      }
      currentX += w;
    }
    currentX += interCharacterGap;
  }
}

export function InvoiceActions({ invoice, booking }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [downloadingThermal, setDownloadingThermal] = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [thermalOpen, setThermalOpen] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState('');

  const invoiceId = invoice.id;
  const invoiceNumber = invoice.invoice_number;

  useEffect(() => {
    const now = new Date(invoice.issue_date);
    const gstOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Dubai',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    };
    setCurrentTimestamp(now.toLocaleString('en-AE', gstOptions).replace(',', ''));
  }, [invoice.issue_date]);

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

  function handlePrintThermal() {
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

  // Derived calculations
  const lineItems = (Array.isArray(invoice.line_items) ? invoice.line_items : []) as any[];
  const vehicleNo = booking ? `VAN-${100 + (parseInt(booking.tracking_id.replace(/\D/g, ''), 10) || 4) % 900}` : 'VAN-101';
  const pickupTimeLabel = booking?.pickup_requested ? '10:00 AM' : '—';
  const pickupDateLabel = booking?.pickup_date ? new Date(booking.pickup_date).toLocaleDateString('en-GB') : '—';
  const routeLabel = booking && booking.sender_city && booking.receiver_city
    ? `${booking.sender_city.slice(0, 3).toUpperCase()} → ${booking.receiver_city.slice(0, 3).toUpperCase()}`
    : 'DXB → SHJ';

  async function handleDownloadThermalPDF() {
    setDownloadingThermal(true);
    try {
      const { jsPDF } = await import('jspdf');
      
      // We will estimate the dynamic height based on the number of line items
      // Base height is 165mm + 8mm per line item
      const dynamicHeight = 160 + lineItems.length * 8;
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, dynamicHeight]
      });

      // Set standard monospace font
      doc.setFont('courier', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);

      let y = 10;
      const xCenter = 40;
      const xLeft = 6;
      const xRight = 74;

      const centerText = (txt: string, yPos: number, isBold = false) => {
        doc.setFont('courier', isBold ? 'bold' : 'normal');
        doc.text(txt, xCenter, yPos, { align: 'center' });
      };

      const leftRightText = (leftTxt: string, rightTxt: string, yPos: number, isBold = false) => {
        doc.setFont('courier', isBold ? 'bold' : 'normal');
        doc.text(leftTxt, xLeft, yPos, { align: 'left' });
        doc.text(rightTxt, xRight, yPos, { align: 'right' });
      };

      const drawDashedLine = (yPos: number) => {
        doc.setFont('courier', 'normal');
        doc.text('-'.repeat(44), xCenter, yPos, { align: 'center' });
      };

      // 1. Company Header
      centerText('SC COURIER SERVICES', y, true);
      y += 4;
      doc.setFontSize(7.5);
      centerText(invoice.company_address || 'Office 12, Level 34, Business Tower', y);
      y += 3.5;
      centerText(`Tel: ${invoice.company_phone || '+971 4 123 4567'}`, y);
      y += 3.5;
      centerText(`Email: ${invoice.company_email || 'info@sccourier.com'}`, y);
      y += 3.5;
      centerText(`VAT Reg No: ${invoice.company_trn || '100XXXXXXXXX3'}`, y);
      y += 4;

      // Divider
      drawDashedLine(y);
      y += 4;

      // 2. Tracking details
      doc.setFontSize(8.5);
      centerText(`TRACKING #: ${booking?.tracking_id || 'SC-0723-1234'}`, y, true);
      y += 4;
      centerText(booking ? `${slugToLabel(booking.service_type).toUpperCase()} DISPATCH` : 'STANDARD DISPATCH', y, true);
      y += 4;

      // Divider
      drawDashedLine(y);
      y += 4;

      // 3. Service details info
      doc.setFontSize(7.5);
      leftRightText(`Pickup: ${pickupTimeLabel}`, `Vehicle: ${vehicleNo}`, y);
      y += 4;
      leftRightText(`Date: ${pickupDateLabel}`, `Route: ${routeLabel}`, y);
      y += 4;

      // Divider
      drawDashedLine(y);
      y += 4;

      // 4. Timestamp
      centerText(currentTimestamp, y, true);
      y += 4;

      // Divider
      drawDashedLine(y);
      y += 4;

      // 5. Line items table
      doc.setFontSize(7.5);
      lineItems.forEach((item) => {
        const desc = item.description || '';
        const amt = `AED ${Number(item.total).toFixed(2)}`;
        
        // Wrap description text to size
        const splitDesc = doc.splitTextToSize(desc, 42);
        
        splitDesc.forEach((line: string, idx: number) => {
          if (idx === 0) {
            leftRightText(line, amt, y);
          } else {
            doc.text(line, xLeft, y, { align: 'left' });
          }
          y += 3.5;
        });
      });

      y += 2;
      leftRightText('Subtotal:', `AED ${Number(invoice.subtotal).toFixed(2)}`, y, true);
      y += 4;
      leftRightText(`Tax (VAT 5%):`, `AED ${Number(invoice.vat_amount).toFixed(2)}`, y);
      y += 4;
      
      // Inner dashed line for total
      drawDashedLine(y);
      y += 4;
      leftRightText('Total:', `AED ${Number(invoice.total_amount).toFixed(2)}`, y, true);
      y += 4;

      // Divider
      drawDashedLine(y);
      y += 4;

      // 6. Payment info
      leftRightText('Payment Method:', slugToLabel(invoice.payment_method), y);
      y += 4;
      leftRightText('Amount Paid:', `AED ${invoice.payment_status === 'paid' ? Number(invoice.total_amount).toFixed(2) : '0.00'}`, y);
      y += 4;
      leftRightText('Change:', 'AED 0.00', y);
      y += 4;

      // Divider
      drawDashedLine(y);
      y += 4;

      // 7. Signature confirmation
      centerText(invoice.payment_status === 'paid' ? 'SIGNATURE CONFIRMED' : 'CONFIRMED', y, true);
      y += 4.5;
      centerText(`Package Weight: ${booking ? Number(booking.weight_kg).toFixed(2) : '0.00'} kg`, y, true);
      y += 4;

      // Divider
      drawDashedLine(y);
      y += 4;

      // 8. Track online link
      centerText('Track online at:', y);
      y += 4;
      centerText('www.sccourier.com/tracking', y, true);
      y += 6;

      // 9. Barcode Code39
      const trackingId = booking?.tracking_id || 'SC-0723-1234';
      
      // Total barcode width calculation
      const barcodeWidth = (trackingId.length + 2) * 3.19;
      const barcodeX = Math.max(5, (80 - barcodeWidth) / 2);
      
      drawCode39(doc, trackingId, barcodeX, y, 12, 0.22);
      y += 15;

      // Alphanumeric tracking ID text
      doc.setFontSize(8.5);
      centerText(trackingId, y, true);

      // Save PDF
      doc.save(`Thermal-Label-${booking?.tracking_id || invoice.invoice_number}.pdf`);
    } catch (err) {
      console.error('Failed to generate thermal PDF:', err);
      alert('Could not download thermal label PDF. Please try again.');
    } finally {
      setDownloadingThermal(false);
    }
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
        variant="outline"
        size="md"
        leftIcon={<Printer className="size-4" />}
        onClick={() => setThermalOpen(true)}
      >
        Thermal Label (80mm)
      </Button>
      <Button
        variant="ghost"
        size="md"
        leftIcon={copied ? <Check className="size-4 text-accent" /> : <Share2 className="size-4" />}
        onClick={handleShare}
      >
        {copied ? 'Copied!' : 'Share'}
      </Button>

      {/* Thermal Label 80mm Print Preview Modal */}
      {thermalOpen && (
        <Modal
          isOpen={thermalOpen}
          onClose={() => setThermalOpen(false)}
          title="Thermal Label 80mm Print Preview"
          size="md"
          footer={
            <div className="flex gap-2 justify-end w-full">
              <Button variant="outline" size="sm" onClick={() => setThermalOpen(false)}>
                Close
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={downloadingThermal ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                onClick={handleDownloadThermalPDF}
                disabled={downloadingThermal}
              >
                {downloadingThermal ? 'Downloading…' : 'Download Label'}
              </Button>
              <Button variant="primary" size="sm" leftIcon={<Printer className="size-4" />} onClick={handlePrintThermal}>
                Print Label
              </Button>
            </div>
          }
        >
          {/* Print Style Overrides */}
          <style dangerouslySetInnerHTML={{__html: `
            @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap');

            @media print {
              /* Hide all standard elements in the body */
              body * {
                visibility: hidden !important;
              }
              /* Show only the target print wrapper and its children */
              .thermal-receipt-print-wrapper, .thermal-receipt-print-wrapper * {
                visibility: visible !important;
              }
              /* Align and format to standard 80mm roll width at top-left */
              .thermal-receipt-print-wrapper {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 80mm !important;
                margin: 0 !important;
                padding: 10px !important;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
              }
            }
          `}} />

          {/* Label Preview Container */}
          <div className="flex justify-center bg-gray-100 p-6 rounded-xl border border-border">
            <div
              className="thermal-receipt-print-wrapper bg-white shadow-md border border-gray-200 p-5 select-none"
              style={{
                width: '80mm',
                minHeight: '120mm',
                fontFamily: "'Courier New', Courier, monospace",
                color: 'black',
                fontSize: '12px',
                lineHeight: '1.4',
              }}
            >
              {/* Header */}
              <div className="text-center" style={{ marginBottom: '10px' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '15px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  SC Courier Services
                </h3>
                <p style={{ margin: '0', fontSize: '11px' }}>{invoice.company_address}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px' }}>
                  Tel: {invoice.company_phone}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px' }}>
                  Email: {invoice.company_email}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px' }}>
                  VAT Reg No: {invoice.company_trn}
                </p>
              </div>

              <div style={{ borderTop: '1px dashed black', margin: '8px 0' }} />

              {/* Tracking Details */}
              <div className="text-center" style={{ marginBottom: '8px' }}>
                <p style={{ margin: '0', fontSize: '12px', fontWeight: 'bold' }}>
                  TRACKING #: {booking?.tracking_id || 'SC-0723-1234'}
                </p>
                <p style={{ margin: '3px 0 0 0', fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  {booking ? `${slugToLabel(booking.service_type)} Dispatch` : 'Standard Dispatch'}
                </p>
              </div>

              <div style={{ borderTop: '1px dashed black', margin: '8px 0' }} />

              {/* Service Details info */}
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '2px 0', width: '55%' }}>Pickup: {pickupTimeLabel}</td>
                    <td style={{ padding: '2px 0', width: '45%', textAlign: 'right' }}>Vehicle: {vehicleNo}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 0' }}>Date: {pickupDateLabel}</td>
                    <td style={{ padding: '2px 0', textAlign: 'right' }}>Route: {routeLabel}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed black', margin: '8px 0' }} />

              {/* Issue Timestamp */}
              <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                {currentTimestamp}
              </div>

              <div style={{ borderTop: '1px dashed black', margin: '8px 0' }} />

              {/* Line items pricing */}
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={i}>
                      <td style={{ padding: '2px 0', verticalAlign: 'top' }}>{item.description}</td>
                      <td style={{ padding: '2px 0', textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        AED {Number(item.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}

                  <tr>
                    <td style={{ padding: '8px 0 2px 0', fontWeight: 'bold' }}>Subtotal:</td>
                    <td style={{ padding: '8px 0 2px 0', textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      AED {Number(invoice.subtotal).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 0' }}>Tax (VAT 5%):</td>
                    <td style={{ padding: '2px 0', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      AED {Number(invoice.vat_amount).toFixed(2)}
                    </td>
                  </tr>
                  <tr style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    <td style={{ padding: '6px 0', borderTop: '1px dashed black' }}>Total:</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', borderTop: '1px dashed black', whiteSpace: 'nowrap' }}>
                      AED {Number(invoice.total_amount).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed black', margin: '8px 0' }} />

              {/* Payment Details */}
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '2px 0', width: '55%' }}>Payment Method:</td>
                    <td style={{ padding: '2px 0', textAlign: 'right' }}>
                      {slugToLabel(invoice.payment_method)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 0' }}>Amount Paid:</td>
                    <td style={{ padding: '2px 0', textAlign: 'right' }}>
                      AED {invoice.payment_status === 'paid' ? Number(invoice.total_amount).toFixed(2) : '0.00'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 0' }}>Change:</td>
                    <td style={{ padding: '2px 0', textAlign: 'right' }}>AED 0.00</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed black', margin: '8px 0' }} />

              {/* Signature / Status details */}
              <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', lineHeight: '1.5' }}>
                {invoice.payment_status === 'paid' ? 'SIGNATURE CONFIRMED' : 'CONFIRMED'}
                <br />
                Package Weight: {booking ? `${Number(booking.weight_kg).toFixed(2)} kg` : '0.00 kg'}
              </div>

              <div style={{ borderTop: '1px dashed black', margin: '8px 0' }} />

              {/* Tracking Link */}
              <div style={{ textAlign: 'center', fontSize: '11px', marginBottom: '10px' }}>
                Track online at:
                <br />
                www.sccourier.com/tracking
              </div>

              {/* Barcode representation */}
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <div style={{ fontFamily: "'Libre Barcode 39', cursive", fontSize: '42px', margin: '2px 0', lineHeight: '1' }}>
                  *{booking?.tracking_id || 'SC-0723-1234'}*
                </div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
                  {booking?.tracking_id || 'SC-0723-1234'}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default InvoiceActions;
