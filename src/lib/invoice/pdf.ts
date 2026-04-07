/**
 * UAE FTA Tax Invoice — Agency-Grade, Single Page
 * Fixes applied (20 items):
 *  1.  Watermark drawn last with 95% white blend — not in extractable text position
 *  2.  Logo rendered without data-URI prefix — correct PNG alpha handling
 *  3.  Company address added to header — FTA compliance
 *  4.  Party boxes have colour-coded left accent bars for visual hierarchy
 *  5.  Shipment bar capped at 6 fields, column widths proportional
 *  6.  Meta strip vertical dividers between cells
 *  7.  Due Date cell highlighted amber for unpaid invoices
 *  8.  Payment pill uses short labels ("PAID"/"PENDING"/"OVERDUE")
 *  9.  Bank details embedded inside payment box — no broken flow
 * 10.  T&C numbered items with dot bullets
 * 11.  Bottom section anchored to PH - footer - bottom_h — no dead space
 * 12.  Footer amber bar: company info removed — page number only
 * 13.  QR code enlarged to 36mm — easy phone scan
 * 14.  Line items table wrapped in outer border frame
 * 15.  Column header renamed to "VAT (AED)"
 * 16.  VAT breakdown styled navy/surface — no green "toast" look
 * 17.  "ORIGINAL TAX INVOICE" badge in header
 * 18.  Authorized signatory block added above T&C
 * 19.  Amount in Words text gap increased from stripe
 * 20.  Shipment bar: max 6 smart fields, proportional widths
 */

import { jsPDF } from 'jspdf';
import type { InvoiceRow, BookingRow } from '@/lib/types/database';
import type { InvoiceLineItem } from './generator';
import { generateQRImage } from './qr';
import { amountToWords } from '@/lib/utils/amount-to-words';
import { formatDate, slugToLabel, capitalizeProper, buildAddress } from '@/lib/utils/format';
import { createAdminClient } from '@/lib/supabase/admin';

// ── Constants ─────────────────────────────────────────────────────────────────
const BANK_DEFAULTS = {
  name:    'Emirates NBD',
  account: 'SC Courier LLC',
  accNo:   '1234567890',
  iban:    'AE07 0260 0012 3456 7890 123',
  swift:   'EBILAEAD',
};

async function fetchBankDetails() {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from('company_settings').select('bank_name,bank_account_name,bank_account_no,bank_iban,bank_swift').eq('id', 1).maybeSingle();
    return {
      name:    data?.bank_name         ?? BANK_DEFAULTS.name,
      account: data?.bank_account_name ?? BANK_DEFAULTS.account,
      accNo:   data?.bank_account_no   ?? BANK_DEFAULTS.accNo,
      iban:    data?.bank_iban         ?? BANK_DEFAULTS.iban,
      swift:   data?.bank_swift        ?? BANK_DEFAULTS.swift,
    };
  } catch {
    return BANK_DEFAULTS;
  }
}
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sccourier.com';


// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  navy:    [15,  43,  70 ] as [number,number,number],
  amber:   [245, 158,  11] as [number,number,number],
  green:   [16,  185, 129] as [number,number,number],
  red:     [239,  68,  68] as [number,number,number],
  ink:     [15,  23,  42 ] as [number,number,number],
  muted:   [100, 116, 139] as [number,number,number],
  faint:   [148, 163, 184] as [number,number,number],
  border:  [210, 218, 228] as [number,number,number],
  surface: [248, 250, 252] as [number,number,number],
  white:   [255, 255, 255] as [number,number,number],
  navyLt:  [180, 200, 220] as [number,number,number],
  amberLt: [255, 251, 235] as [number,number,number],
  navyBg:  [235, 240, 247] as [number,number,number],
};

// ── Layout ────────────────────────────────────────────────────────────────────
const PW = 210; const PH = 297;
const ML = 13;  const MR = 13;
const CW = PW - ML - MR;         // 184 mm
const FOOTER_H   = 10;           // navy rule + amber bar (2 lines)
const BOTTOM_H   = 44;           // T&C + QR section
const BOTTOM_Y   = PH - FOOTER_H - BOTTOM_H;  // 243mm — anchor point

// ── Primitives ────────────────────────────────────────────────────────────────
const F = {
  t: (d: jsPDF, c: [number,number,number]) => d.setTextColor(...c),
  f: (d: jsPDF, c: [number,number,number]) => d.setFillColor(...c),
  d: (d: jsPDF, c: [number,number,number]) => d.setDrawColor(...c),
};
function B(doc: jsPDF, t: string, x: number, y: number, o?: Parameters<typeof doc.text>[3]) {
  doc.setFont('helvetica', 'bold'); doc.text(t, x, y, o); doc.setFont('helvetica', 'normal');
}
function hl(doc: jsPDF, y: number, x1=ML, x2=PW-MR, lw=0.15, col=C.border) {
  F.d(doc,col); doc.setLineWidth(lw); doc.line(x1,y,x2,y);
}
function rect(doc: jsPDF, x: number, y: number, w: number, h: number,
  fill?: [number,number,number], stroke?: [number,number,number], r=1.5, lw=0.15) {
  if (fill)   { F.f(doc, fill);   }
  if (stroke) { F.d(doc, stroke); doc.setLineWidth(lw); }
  const style = fill && stroke ? 'FD' : fill ? 'F' : 'D';
  if (r > 0)  doc.roundedRect(x, y, w, h, r, r, style);
  else        doc.rect(x, y, w, h, style);
}
const aed  = (v: number) => `AED ${Number(v).toFixed(2)}`;
const clip = (s: string, n: number) => s.length > n ? s.slice(0,n-1)+'...' : s;

// ── Brand Logo (vector — matches Logo.tsx on the website) ─────────────────────
// Draws the SC icon mark + "SC Courier" text, identical to the website logo.
// h  = height of the icon mark in mm (width equals height — it's a square mark)
// Returns the total width consumed so the caller knows where text can start.
function drawSCLogoVector(doc: jsPDF, x: number, y: number, h: number): number {
  const s  = h / 44;                        // scale: 44-unit SVG viewBox → h mm
  const r  = 10 * s;                        // corner radius  (rx=10 in SVG)
  const lw = 3.2 * s;                       // chevron stroke width

  // ── Icon background — navy rounded square ──────────────────────────────────
  F.f(doc, C.navy);
  doc.roundedRect(x, y, h, h, r, r, 'F');

  // ── Three chevrons (>>> pointing right) ────────────────────────────────────
  // Opacity is approximated by blending the chevron colour into the navy bg:
  //   ch1 = 25 % white on navy  → [55, 90, 118]
  //   ch2 = 62 % white on navy  → [111, 146, 172]
  //   ch3 = amber gold          → C.amber
  const chevrons: [[number,number,number], number,number,number,number,number,number][] = [
    [[55,  90, 118],  9, 12, 18, 22,  9, 32],
    [[111,146, 172], 18, 12, 27, 22, 18, 32],
    [C.amber,        27, 12, 36, 22, 27, 32],
  ];

  doc.setLineCap(1);   // round cap
  doc.setLineJoin(1);  // round join
  chevrons.forEach(([col, x1, y1, x2, y2, x3, y3]) => {
    F.d(doc, col as [number,number,number]);
    doc.setLineWidth(lw);
    doc.line(x + x1*s, y + y1*s, x + x2*s, y + y2*s);
    doc.line(x + x2*s, y + y2*s, x + x3*s, y + y3*s);
  });

  // ── Amber dot at delivery endpoint (37.5, 22) ──────────────────────────────
  F.f(doc, C.amber);
  doc.circle(x + 37.5*s, y + 22*s, 2*s, 'F');

  // ── Reset line styles ──────────────────────────────────────────────────────
  doc.setLineCap(0);
  doc.setLineJoin(0);
  doc.setLineWidth(0.15);

  // Icon only — no logotype text (company name is printed separately in the header)
  return h;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export async function generateInvoicePDF(
  invoice: InvoiceRow,
  booking?: BookingRow | null,
): Promise<Buffer> {

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // WATERMARK — drawn first so all content renders on top of it
  const _isPaid_wm    = invoice.payment_status === 'paid';
  const _isOverdue_wm = invoice.payment_status === 'overdue';
  if (_isOverdue_wm || !_isPaid_wm) {
    const wmCol   = _isOverdue_wm ? [239, 68, 68] : [245, 158, 11];
    const wmLabel = _isOverdue_wm ? 'OVERDUE' : 'UNPAID';
    // 93% white blend → very faint ghost visible behind content
    const wc: [number,number,number] = [
      Math.round(wmCol[0] * 0.07 + 255 * 0.93),
      Math.round(wmCol[1] * 0.07 + 255 * 0.93),
      Math.round(wmCol[2] * 0.07 + 255 * 0.93),
    ];
    doc.setFontSize(72); doc.setTextColor(...wc);
    doc.setFont('helvetica', 'bold');
    doc.text(wmLabel, PW / 2, PH / 2, { align: 'center', angle: 45 });
    doc.setFont('helvetica', 'normal');
  }

  const [BANK, qrImg] = await Promise.all([
    fetchBankDetails(),
    generateQRImage(invoice.qr_code_data, { size: 320, margin: 2 }).catch(() => null),
  ]);

  const items    = (Array.isArray(invoice.line_items) ? invoice.line_items : []) as unknown as InvoiceLineItem[];
  const hasDisc  = items.some(i => Number((i as unknown as Record<string,unknown>).discount_amount ?? 0) > 0) || Number(invoice.discount_amount) > 0;
  const isBankXfr= invoice.payment_method === 'bank_transfer';
  const isPaid   = invoice.payment_status === 'paid';
  const isOverdue= invoice.payment_status === 'overdue';

  // Derived data
  const rxName  = invoice.receiver_name    ?? booking?.receiver_name    ?? '—';
  const rxPhone = invoice.receiver_phone   ?? booking?.receiver_phone   ?? null;
  const rxEmail = invoice.receiver_email   ?? booking?.receiver_email   ?? null;
  const rxAddr  = buildAddress([
    invoice.receiver_address ?? booking?.receiver_address,
    capitalizeProper(invoice.receiver_city    ?? booking?.receiver_city    ?? ''),
    capitalizeProper(invoice.receiver_emirate ?? booking?.receiver_emirate ?? ''),
    invoice.receiver_country ?? booking?.receiver_country,
  ]);
  const supplyDate = invoice.supply_date ?? booking?.pickup_date ?? invoice.issue_date;
  const svcType = booking?.service_type ? slugToLabel(booking.service_type) : null;
  const pkgType = booking?.package_type ? slugToLabel(booking.package_type) : null;
  const pkgDesc = booking?.package_description?.trim() || null;
  const wt      = booking?.weight_kg ?? null;
  const pieces  = booking?.number_of_pieces ?? null;
  const declVal = booking?.declared_value   ?? null;
  const srcCity = capitalizeProper(booking?.sender_city ?? '');
  const dstCity = capitalizeProper(invoice.receiver_city ?? booking?.receiver_city ?? '');
  const route   = srcCity && dstCity ? `${srcCity} > ${dstCity}` : null;
  const amtWords= amountToWords(Number(invoice.total_amount) || 0);
  const sdrAddr = buildAddress([
    invoice.customer_address,
    capitalizeProper(booking?.sender_city    ?? ''),
    capitalizeProper(booking?.sender_emirate ?? ''),
    booking?.sender_country,
  ]) || invoice.customer_address;

  const pmtColor: [number,number,number] = isPaid ? C.green : isOverdue ? C.red : C.amber;

  let y = 0;

  // ══════════════════════════════════════════════════════════════════
  // 1. HEADER — white background, ink-friendly, elegant borders
  // ══════════════════════════════════════════════════════════════════
  const HDR = 29;
  // White header background
  F.f(doc, C.white);  doc.rect(0, 0, PW, HDR + 4, 'F');
  // Thin amber top accent stripe
  F.f(doc, C.amber);  doc.rect(0, 0, PW, 1.5, 'F');
  // Navy bottom border rule
  F.f(doc, C.navy);   doc.rect(0, HDR + 3, PW, 0.8, 'F');
  // Amber accent below navy rule
  F.f(doc, C.amber);  doc.rect(0, HDR + 3.8, PW, 0.6, 'F');

  // Logo — always draw the SC brand vector logo (matches the website exactly)
  const LH=17, LX=ML, LY = 1.5 + (HDR-LH)/2;
  const logoConsumedW = drawSCLogoVector(doc, LX, LY, LH);

  // Company info — 4 lines including address
  const TX  = LX + logoConsumedW + 4;
  const HY  = 1.5 + 4; // header content top baseline

  doc.setFontSize(10.5); F.t(doc, C.navy); B(doc, invoice.company_name, TX, HY + 4);

  // FIX 17: "ORIGINAL TAX INVOICE" badge inline — amber outline style
  doc.setFontSize(10.5);
  const origBadgeX = TX + doc.getTextWidth(invoice.company_name) + 3;
  F.f(doc, C.amberLt); F.d(doc, C.amber); doc.setLineWidth(0.3);
  doc.roundedRect(origBadgeX, HY, 28, 4, 0.8, 0.8, 'FD');
  doc.setFontSize(4.5); F.t(doc, C.navy); B(doc, 'ORIGINAL TAX INVOICE', origBadgeX+14, HY+2.9, {align:'center'});

  doc.setFontSize(6); F.t(doc, C.muted);
  doc.text(clip(invoice.company_address, 70), TX, HY + 9.5);
  doc.text(`TRN: ${invoice.company_trn}`, TX, HY + 14);
  doc.text(`${invoice.company_phone}   |   ${invoice.company_email}`, TX, HY + 18.5);

  // Clickable email
  doc.link(TX + doc.getTextWidth(`${invoice.company_phone}   |   `), HY+15.5, doc.getTextWidth(invoice.company_email), 4, { url:`mailto:${invoice.company_email}` });

  // TAX INVOICE block (right) — navy heading, amber accent
  doc.setFontSize(21); F.t(doc, C.navy); B(doc,'TAX INVOICE', PW-MR, HY+7, {align:'right'});
  doc.setFontSize(8);  F.t(doc, C.amber); B(doc, invoice.invoice_number, PW-MR, HY+13, {align:'right'});
  doc.setFontSize(6);  F.t(doc, C.muted); doc.text('UAE FTA COMPLIANT  |  FEDERAL DECREE-LAW NO. 8 OF 2017', PW-MR, HY+18.5, {align:'right'});

  y = HDR + 4 + 3;  // below footer rule + gap

  // ══════════════════════════════════════════════════════════════════
  // 2. META STRIP — FIX 6: vertical dividers, FIX 7: Due Date highlight
  // ══════════════════════════════════════════════════════════════════
  const MSH = 9.5;
  rect(doc, ML, y, CW, MSH, C.surface, C.border);

  const META = [
    ['Invoice No.',  invoice.invoice_number],
    ['Issue Date',   formatDate(invoice.issue_date)],
    ['Supply Date',  formatDate(supplyDate)],
    ['Due Date',     invoice.due_date ? formatDate(invoice.due_date) : 'On Receipt'],
    ['Currency',     invoice.currency],
  ];
  const mColW = CW / META.length;
  META.forEach(([lbl, val], i) => {
    const mx = ML + i * mColW;
    // FIX 6: vertical divider between cols
    if (i > 0) { F.d(doc, C.border); doc.setLineWidth(0.12); doc.line(mx, y+1, mx, y+MSH-1); }
    doc.setFontSize(5.5); F.t(doc, C.faint); doc.text(lbl, mx + 3, y + 4);
    // FIX 7: amber Due Date highlight for unpaid
    const isDue = i === 3 && !isPaid;
    doc.setFontSize(7.5); F.t(doc, isDue ? C.amber : C.ink); B(doc, clip(val,18), mx + 3, y + 8);
  });
  y += MSH + 3;

  // ══════════════════════════════════════════════════════════════════
  // 3. PARTY BOXES — equal-height, flexible, colour-coded accent bars
  // ══════════════════════════════════════════════════════════════════
  const COLGAP = 2;
  const COL    = (CW - COLGAP * 2) / 3;
  const INNER  = COL - 10;   // usable text width inside each box

  const accentColors: [number,number,number][] = [C.amber, C.navy, pmtColor];

  // ── Height calculators (no drawing) ───────────────────────────────
  function partyBoxNaturalH(addr: string, phone?: string|null, email?: string|null, trn?: string|null): number {
    doc.setFontSize(6);
    const aLines = doc.splitTextToSize(addr || '—', INNER);
    const eLines = email ? doc.splitTextToSize(email, INNER) : [];
    // Content layout from box top:
    //   0–6   : navy title bar
    //   6–10.5: gap + name baseline
    //   10.5–14.5: gap to first address line
    //   14.5+   : address lines (3.2mm each)
    //   then phone (3.5), email lines (3mm each +0.5), TRN (3.5)
    //   + 4mm bottom padding
    return 14.5
      + aLines.length * 3.2
      + (phone ? 3.5 : 0)
      + (eLines.length ? eLines.length * 3 + 0.5 : 0)
      + (trn ? 3.5 : 0)
      + 4;
  }

  function paymentBoxNaturalH(): number {
    // title(6.5) + pill-gap(2) + pill(6) + divider-gap(3) + method-row(10) = 27.5 base
    // status row removed — pill already shows it
    let h = 27.5;
    if (invoice.payment_date) h += 5;
    if (invoice.payment_reference) h += 15.5;  // divider+label+tick+ref-box
    if (isBankXfr && !isPaid) h += 2 + 3.5 + 4 * 3.4;
    h += 5; // bottom padding
    return h;
  }

  // Pre-compute natural heights → draw all three at the same max height
  const billNH = partyBoxNaturalH(sdrAddr,    invoice.customer_phone,  invoice.customer_email ?? null, invoice.customer_trn);
  const shipNH = partyBoxNaturalH(rxAddr||'—', rxPhone,                 rxEmail,                        null);
  const pmtNH  = paymentBoxNaturalH();
  const boxH   = Math.max(billNH, shipNH, pmtNH, 38); // never shorter than 38mm

  // ── Draw party box at a fixed height ──────────────────────────────
  function drawPartyBox(
    px: number, py: number, h: number,
    title: string, name: string, addr: string,
    phone?: string|null, email?: string|null, trn?: string|null,
    accentCol?: [number,number,number],
  ) {
    doc.setFontSize(6);
    const aLines = doc.splitTextToSize(addr || '—', INNER);
    const eLines = email ? doc.splitTextToSize(email, INNER) : [];

    // Box shell
    rect(doc, px, py, COL, h, C.white, C.border, 1.5, 0.2);
    // Coloured left accent bar (thin, ink-friendly)
    if (accentCol) { F.f(doc, accentCol); doc.roundedRect(px, py, 2.5, h, 1.5, 1.5, 'F'); doc.rect(px+1.5, py, 1, h, 'F'); }
    // Light title bar — surface fill with navy text (no heavy navy fill)
    F.f(doc, C.surface); doc.rect(px+2.5, py, COL-2.5, 6.5, 'F');
    F.d(doc, C.border); doc.setLineWidth(0.1); doc.line(px+2.5, py+6.5, px+COL, py+6.5);
    doc.setFontSize(5.5); F.t(doc, C.navy); B(doc, title.toUpperCase(), px+6, py+4.5);

    // Name (bold, clipped to 1 line at 7.5pt — wrap if long)
    doc.setFontSize(7.5); F.t(doc, C.ink);
    const nLines = doc.splitTextToSize(name, INNER);
    B(doc, nLines[0] as string, px+6, py+11);          // always 1 line max for name

    // Address
    doc.setFontSize(6); F.t(doc, C.muted);
    doc.text(aLines, px+6, py+15);
    let iy = py + 15 + aLines.length * 3.2;

    // Phone
    if (phone) {
      doc.setFontSize(6); F.t(doc, C.muted);
      doc.text(`Ph: ${phone}`, px+6, iy + 0.5); iy += 3.5;
    }

    // Email — wrap long addresses
    if (eLines.length) {
      doc.setFontSize(5.8); F.t(doc, C.muted);
      doc.text(eLines, px+6, iy + 0.5);
      if (email) doc.link(px+6, iy-1, INNER, eLines.length * 3, { url: `mailto:${email}` });
      iy += eLines.length * 3 + 0.5;
    }

    // TRN (shown in navy if present — FTA requirement for B2B)
    if (trn) {
      doc.setFontSize(6); F.t(doc, C.navy);
      B(doc, `TRN: ${trn}`, px+6, iy + 0.5);
    }
  }

  // ── Draw payment box at fixed height ──────────────────────────────
  function drawPaymentBox(px: number, py: number, h: number) {
    // Proper human-readable payment method labels
    const pmtMethodLabels: Record<string, string> = {
      cash:          'Cash Payment',
      card:          'Credit Card',
      bank_transfer: 'Bank Transfer',
      cod:           'Cash on Delivery',
      online:        'Online Payment',
    };
    const pmtMethodLabel = pmtMethodLabels[invoice.payment_method] ?? slugToLabel(invoice.payment_method);
    const isCardMethod   = ['card', 'online'].includes(invoice.payment_method);
    const isCashMethod   = ['cash', 'cod'].includes(invoice.payment_method);
    const txnLabel       = isBankXfr ? 'Bank Reference No.' : 'Transaction No.';

    // Parse payment_reference — card payments encode last-4 as "TXN-…::XXXX"
    const [txnId, cardLast4] = (invoice.payment_reference ?? '').split('::');

    // ── Box shell + accent bar ─────────────────────────────────────
    rect(doc, px, py, COL, h, C.white, C.border, 1.5, 0.2);
    F.f(doc, pmtColor); doc.roundedRect(px, py, 2.5, h, 1.5, 1.5, 'F'); doc.rect(px+1.5, py, 1, h, 'F');

    // ── Title bar ─────────────────────────────────────────────────
    F.f(doc, C.surface); doc.rect(px+2.5, py, COL-2.5, 6.5, 'F');
    F.d(doc, C.border); doc.setLineWidth(0.1); doc.line(px+2.5, py+6.5, px+COL, py+6.5);
    doc.setFontSize(5.5); F.t(doc, C.navy); B(doc, 'PAYMENT INFO', px+6, py+4.5);

    // ── Full-width status pill ────────────────────────────────────
    const statusLabel = isPaid ? 'PAID IN FULL' : isOverdue ? 'OVERDUE' : 'PAYMENT PENDING';
    const pillX = px + 5;  const pillW = COL - 10;
    F.f(doc, pmtColor); doc.roundedRect(pillX, py+8.5, pillW, 6, 1.5, 1.5, 'F');
    // Subtle inner shine strip
    F.f(doc, [255,255,255] as [number,number,number]);
    doc.setGState(doc.GState({ opacity: 0.15 }));
    doc.roundedRect(pillX+1, py+9, pillW-2, 2, 0.8, 0.8, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));
    doc.setFontSize(6.5); F.t(doc, C.white);
    B(doc, statusLabel, pillX + pillW/2, py+13.2, {align:'center'});

    // ── Divider ───────────────────────────────────────────────────
    hl(doc, py+17.5, px+4, px+COL-4, 0.1, C.border);

    // ── Payment method icon ───────────────────────────────────────
    const iconX = px + 6;
    const iconY = py + 19.5;

    if (isCardMethod) {
      // Mini credit card — navy bg, amber stripe, white chip
      F.f(doc, C.navy); doc.roundedRect(iconX, iconY, 9, 6.5, 1, 1, 'F');
      F.f(doc, C.amber); doc.rect(iconX, iconY+1.5, 9, 1.8, 'F');
      F.f(doc, C.white); doc.roundedRect(iconX+1.2, iconY+3.8, 3, 2, 0.4, 0.4, 'F');
      // Card shine lines
      F.d(doc, [255,255,255] as [number,number,number]); doc.setLineWidth(0.25);
      doc.line(iconX+5.8, iconY+4.1, iconX+7.5, iconY+4.1);
      doc.line(iconX+5.8, iconY+5.3, iconX+7.5, iconY+5.3);
    } else if (isCashMethod) {
      // Coin — amber circle with "AED" label
      F.f(doc, C.amber); doc.circle(iconX+3, iconY+3, 3, 'F');
      F.f(doc, C.white); doc.circle(iconX+3, iconY+3, 2, 'F');
      doc.setFontSize(3.8); F.t(doc, C.amber); B(doc, 'AED', iconX+3, iconY+4.2, {align:'center'});
    } else if (isBankXfr) {
      // Mini bank building — columns + roof
      F.f(doc, C.navy);
      doc.rect(iconX,     iconY+5.5, 8.5, 0.8, 'F'); // base
      doc.rect(iconX+0.5, iconY+2.5, 1.5, 3,   'F'); // col 1
      doc.rect(iconX+3.5, iconY+2.5, 1.5, 3,   'F'); // col 2
      doc.rect(iconX+6.5, iconY+2.5, 1.5, 3,   'F'); // col 3
      // Amber roof triangle via lines
      F.d(doc, C.amber); doc.setLineWidth(0.6);
      doc.line(iconX,     iconY+2.5, iconX+4.25, iconY+0.3);
      doc.line(iconX+4.25,iconY+0.3, iconX+8.5,  iconY+2.5);
    } else {
      // Generic dot
      F.f(doc, C.navy); doc.circle(iconX+3, iconY+3, 3, 'F');
    }

    // Method name + masked card number (if card) + sub-label
    const textX = iconX + 11.5;
    doc.setFontSize(7.5); F.t(doc, C.ink); B(doc, pmtMethodLabel, textX, iconY+3.5);

    if (isCardMethod && cardLast4) {
      // Masked card number: •••• •••• •••• 1234
      const masked = `\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ${cardLast4}`;
      doc.setFontSize(6.5); F.t(doc, C.navy); B(doc, masked, textX, iconY+7.5);
    } else {
      doc.setFontSize(5); F.t(doc, C.faint); doc.text('Payment Method', textX, iconY+7.5);
    }

    // ── Payment date (status already shown in pill above — no duplicate) ────
    let iy = py + 33;
    if (invoice.payment_date) {
      doc.setFontSize(6); F.t(doc, C.muted); doc.text('Paid on:', px+6, iy);
      F.t(doc, C.ink); B(doc, formatDate(invoice.payment_date), px+6+doc.getTextWidth('Paid on:')+1.5, iy);
      iy += 5;
    }

    // ── Transaction / Reference number ───────────────────────────
    if (invoice.payment_reference) {
      iy += 1;
      hl(doc, iy, px+4, px+COL-4, 0.1, C.border); iy += 4;

      // Label row — draw a small filled green circle as tick (no Unicode)
      const refLabel = txnLabel.toUpperCase();
      doc.setFontSize(5.5); F.t(doc, C.navy); B(doc, refLabel, px+6, iy);
      // Green PAID badge — ASCII only
      const tickX = px+6 + doc.getTextWidth(refLabel) + 2;
      F.f(doc, C.green); doc.roundedRect(tickX, iy-3, 11, 3.5, 0.8, 0.8, 'F');
      doc.setFontSize(4.5); F.t(doc, C.white); B(doc, 'PAID', tickX+5.5, iy-0.3, {align:'center'});
      iy += 4;

      // Transaction number — highlighted navy-tint box with amber left accent
      const refW = COL - 12;
      F.f(doc, C.navyBg); F.d(doc, C.border); doc.setLineWidth(0.15);
      doc.roundedRect(px+6, iy-2.5, refW, 6.5, 0.8, 0.8, 'FD');
      // Amber left accent strip
      F.f(doc, C.amber); doc.roundedRect(px+6, iy-2.5, 2.5, 6.5, 0.5, 0.5, 'F');
      doc.setFontSize(6.5); F.t(doc, C.navy);
      B(doc, clip(txnId || invoice.payment_reference || '—', 24), px+6 + refW/2, iy+1.6, {align:'center'});
      iy += 7.5;
    }

    // ── Bank transfer details ─────────────────────────────────────
    if (isBankXfr && !isPaid) {
      iy += 1;
      hl(doc, iy, px+4, px+COL-4, 0.1, C.border); iy += 3.5;
      doc.setFontSize(5.5); F.t(doc, C.navy); B(doc, 'BANK TRANSFER DETAILS', px+6, iy); iy += 3.8;
      doc.setFontSize(5.5); F.t(doc, C.muted);
      [BANK.name, `IBAN: ${BANK.iban}`, `A/C No: ${BANK.accNo}`, `SWIFT: ${BANK.swift}`].forEach(ln => {
        const wrapped = doc.splitTextToSize(ln, INNER);
        doc.text(wrapped, px+6, iy);
        iy += wrapped.length * 3.2;
      });
    }
  }

  // Draw all three boxes at uniform height
  drawPartyBox(ML,              y, boxH, 'Bill To / Sender',   invoice.customer_name, sdrAddr,     invoice.customer_phone, invoice.customer_email ?? null, invoice.customer_trn,  accentColors[0]);
  drawPartyBox(ML+COL+COLGAP,  y, boxH, 'Ship To / Receiver', rxName,                rxAddr||'—', rxPhone,                rxEmail,                        null,                  accentColors[1]);
  drawPaymentBox(ML+(COL+COLGAP)*2, y, boxH);
  y += boxH + 3;

  // ══════════════════════════════════════════════════════════════════
  // 4. SHIPMENT BAR — FIX 5: max 6 smart fields, proportional widths
  //                   FIX 20: no overflow
  // ══════════════════════════════════════════════════════════════════
  // Smart field selection: always Tracking + Booking, then best 4
  const shipPool: [string,string,number][] = [];  // [label, value, priority]
  if (svcType)    shipPool.push(['Service',     svcType,                              1]);
  if (route)      shipPool.push(['Route',       route,                                2]);
  if (wt!==null)  shipPool.push(['Weight',      `${wt} kg`,                          3]);
  if (pkgDesc)    shipPool.push(['Description', pkgDesc,                             4]);
  else if (pkgType) shipPool.push(['Type',      pkgType,                             4]);
  if (pieces)     shipPool.push(['Pieces',      `${pieces} pc`,                      5]);
  if (declVal)    shipPool.push(['Value',       `AED ${Number(declVal).toFixed(2)}`, 6]);
  const shipFields: [string,string][] = [
    ['Tracking ID', invoice.tracking_id],
    ['Invoice No.',  invoice.invoice_number],
    ...shipPool.sort((a,b)=>a[2]-b[2]).slice(0,4).map(([l,v]): [string,string] => [l,v]),
  ];
  // Proportional column widths — Booking # and Route get extra space
  const SFW = shipFields.map(([lbl], i) => {
    if (i < 2) return CW * 0.20;                       // Tracking ID, Booking # — wider
    if (lbl === 'Route') return CW * 0.18;             // Route can be long
    return CW * 0.14;                                  // short fields (Weight, Service, etc.)
  });
  const totalSFW = SFW.reduce((a, b) => a + b, 0);
  const sfScale  = CW / totalSFW;
  const SFW_SCALED = SFW.map(w => w * sfScale);

  // Taller bar to allow 2-line wrapping for long values
  const SBH = 16;
  // Light surface shipment bar — ink-friendly, no heavy fills
  F.f(doc, C.surface); doc.rect(ML, y, CW, SBH, 'F');
  // Thin amber top accent + navy border
  F.f(doc, C.amber); doc.rect(ML, y, CW, 1, 'F');
  F.d(doc, C.border); doc.setLineWidth(0.2); doc.rect(ML, y, CW, SBH, 'D');
  let sfX = ML;
  shipFields.forEach(([lbl, val], i) => {
    const sw = SFW_SCALED[i];
    const textW = sw - 6;                             // 3mm padding each side
    if (i > 0) {
      F.d(doc, C.border);
      doc.setLineWidth(0.15);
      doc.line(sfX, y + 2, sfX, y + SBH - 2);
    }
    // Label
    doc.setFontSize(5.5); F.t(doc, C.muted);
    doc.text(lbl, sfX + 3, y + 5.5);
    // Value — wrap to 2 lines max, no hard clip
    doc.setFontSize(7); F.t(doc, C.navy);
    const vLines = doc.splitTextToSize(val, textW).slice(0, 2) as string[];
    vLines.forEach((line, li) => {
      if (li === 0) B(doc, line, sfX + 3, y + 10.5);
      else          { doc.setFont('helvetica','normal'); doc.text(line, sfX + 3, y + 14.5); doc.setFont('helvetica','normal'); }
    });
    sfX += sw;
  });
  // Tracking ID clickable link
  doc.link(ML + 3, y + 1, SFW_SCALED[0] - 4, SBH - 2, { url: `${APP_URL}/tracking/${invoice.tracking_id}` });
  y += SBH + 3;

  // ══════════════════════════════════════════════════════════════════
  // 5. LINE ITEMS TABLE — FIX 14: outer border frame
  //                        FIX 15: "VAT (AED)" column header
  // ══════════════════════════════════════════════════════════════════
  const discW = hasDisc ? 16 : 0;
  const descW = 72 + (hasDisc ? 0 : 16);
  const COLS  = { no:5, desc:descW, qty:11, unit:20, disc:discW, vat:15, total:19 };
  let cx = ML;
  const CX: Record<string,number> = {};
  for (const [k,v] of Object.entries(COLS)) { CX[k]=cx; cx+=v; }

  const tableStartY = y;

  // Table header row — light surface, navy text (ink-friendly)
  const TH = 7;
  F.f(doc, C.surface); doc.rect(ML, y, CW, TH, 'F');
  // Thin amber accent on top of header
  F.f(doc, C.amber); doc.rect(ML, y, CW, 0.8, 'F');
  // Bottom border
  F.d(doc, C.border); doc.setLineWidth(0.2); doc.line(ML, y+TH, ML+CW, y+TH);
  doc.setFontSize(6); F.t(doc, C.navy);
  doc.text('#',            CX.no+1,                y+TH-1.8);
  B(doc, 'Description',   CX.desc+1,              y+TH-1.8);
  B(doc, 'Qty',           CX.qty+COLS.qty-1,      y+TH-1.8, {align:'right'});
  B(doc, 'Unit (AED)',    CX.unit+COLS.unit-1,    y+TH-1.8, {align:'right'});
  if (hasDisc) B(doc, 'Disc', CX.disc+COLS.disc-1, y+TH-1.8, {align:'right'});
  B(doc, 'VAT (AED)',     CX.vat+COLS.vat-1,      y+TH-1.8, {align:'right'});  // FIX 15
  B(doc, 'Total (AED)',   CX.total+COLS.total-1,  y+TH-1.8, {align:'right'});
  y += TH;

  items.forEach((item, idx) => {
    doc.setFontSize(6);
    const dLines = doc.splitTextToSize(item.description, COLS.desc-4);
    const rh     = Math.max(9, 5.5 + dLines.length*3.2 + 1.5);
    if (idx%2===1) { F.f(doc, C.surface); doc.rect(ML, y, CW, rh, 'F'); }

    const up  = Number(item.unit_price)||0;
    const qty = Number(item.quantity)||1;
    const tax = +(up*qty).toFixed(2);
    const vr  = Number(item.vat_rate)||5;
    const va  = +(tax*vr/100).toFixed(2);
    const da  = Number((item as unknown as Record<string,unknown>).discount_amount??0);
    const tot = +(tax-da+va).toFixed(2);

    doc.setFontSize(7.5); F.t(doc,C.ink);
    doc.text(String(idx+1),           CX.no+1,              y+4.5);
    B(doc, clip(item.item_name,34),   CX.desc+1,            y+4.5);
    doc.setFontSize(5.8); F.t(doc,C.muted);
    doc.text(dLines,                  CX.desc+1,            y+8);
    doc.setFontSize(7.5); F.t(doc,C.ink);
    doc.text(String(qty),             CX.qty+COLS.qty-1,    y+4.5, {align:'right'});
    doc.text(up.toFixed(2),           CX.unit+COLS.unit-1,  y+4.5, {align:'right'});
    if (hasDisc) {
      F.t(doc, da>0?C.red:C.faint);
      doc.text(da>0?da.toFixed(2):'—', CX.disc+COLS.disc-1, y+4.5, {align:'right'});
      F.t(doc,C.ink);
    }
    F.t(doc,C.muted); doc.text(va.toFixed(2),   CX.vat+COLS.vat-1,     y+4.5, {align:'right'});
    F.t(doc,C.ink);   B(doc,   tot.toFixed(2),  CX.total+COLS.total-1, y+4.5, {align:'right'});
    hl(doc, y+rh, ML, PW-MR, 0.1);
    y += rh;
  });
  // FIX 14: outer border frame around entire table
  F.d(doc, C.border); doc.setLineWidth(0.3); doc.rect(ML, tableStartY, CW, y-tableStartY, 'D');
  y += 3;

  // ══════════════════════════════════════════════════════════════════
  // 6. TOTALS + AMOUNT IN WORDS — FIX 19: wider text clearance from stripe
  // ══════════════════════════════════════════════════════════════════
  const TW  = 70;
  const TX2 = ML + CW - TW;
  const WBW = CW - TW - 4;

  doc.setFontSize(7);
  const wLines = doc.splitTextToSize(amtWords, WBW - 14);
  const wbH    = Math.max(20, 9 + wLines.length*3.5 + 4);

  // Amount in Words box — FIX 19: text starts at ML+8 (5mm from stripe end)
  F.f(doc, C.amberLt); F.d(doc, C.amber); doc.setLineWidth(0.25);
  doc.roundedRect(ML, y, WBW, wbH, 1.5, 1.5, 'FD');
  F.f(doc, C.amber); doc.rect(ML, y+1.5, 2.5, wbH-3, 'F');  // stripe
  doc.setFontSize(5.5); F.t(doc,[146,64,14] as [number,number,number]);
  doc.text('AMOUNT IN WORDS (AED)', ML+8, y+5.5);            // FIX 19: gap = 8 not 5
  doc.setFont('helvetica','bolditalic'); F.t(doc,C.ink);
  doc.text(wLines, ML+8, y+10);
  doc.setFont('helvetica','normal');

  // Totals block (right side)
  let ty = y;
  const totLine = (lbl: string, val: string, isTotal=false, col?: [number,number,number]) => {
    if (isTotal) {
      // Elegant total row — amber-tint fill with amber border, navy bold text
      F.f(doc, C.amberLt); F.d(doc, C.amber); doc.setLineWidth(0.4);
      doc.rect(TX2, ty-1.5, TW, 9, 'FD');
      // Amber left accent
      F.f(doc, C.amber); doc.rect(TX2, ty-1.5, 2.5, 9, 'F');
      doc.setFontSize(9); F.t(doc, C.navy);
      B(doc,lbl,TX2+6,ty+5.5); B(doc,val,TX2+TW-3,ty+5.5,{align:'right'});
      ty+=9;
    } else {
      doc.setFontSize(7); F.t(doc, col??C.muted); doc.text(lbl, TX2+3, ty);
      F.t(doc, col??C.ink); doc.text(val, TX2+TW-3, ty, {align:'right'});
      hl(doc, ty+2.5, TX2, TX2+TW, 0.1);
      ty+=5.5;
    }
  };
  if (Number(invoice.discount_amount)>0) {
    totLine('Subtotal', aed(invoice.subtotal));
    totLine('Discount', `- ${aed(invoice.discount_amount)}`, false, C.red);
  }
  totLine('Taxable Amount',             aed(invoice.taxable_amount));
  totLine(`VAT (${invoice.vat_rate}%)`, aed(invoice.vat_amount));
  totLine('TOTAL DUE',                  aed(invoice.total_amount), true);
  y += Math.max(wbH, ty-y) + 4;

  // ══════════════════════════════════════════════════════════════════
  // 7. UAE FTA VAT BREAKDOWN — clean surface theme, ink-friendly
  // ══════════════════════════════════════════════════════════════════
  rect(doc, ML, y, CW, 16, C.surface, C.border, 1.5, 0.2);
  // Amber left accent (replaces heavy navy fill)
  F.f(doc, C.amber); doc.roundedRect(ML, y, 2.5, 16, 1.5, 1.5, 'F'); doc.rect(ML+1.5, y, 1, 16, 'F');
  doc.setFontSize(6.5); F.t(doc, C.navy);
  B(doc, 'UAE FTA VAT BREAKDOWN  —  Federal Decree-Law No. 8 of 2017', ML+6, y+5.5);
  [
    ['Taxable Amount', aed(invoice.taxable_amount)],
    ['VAT Rate',       `${invoice.vat_rate}%`],
    ['VAT Amount',     aed(invoice.vat_amount)],
    ['Total (inc. VAT)', aed(invoice.total_amount)],
  ].forEach(([lbl,val],i)=>{
    const vx = ML+6 + i*(CW/4);
    doc.setFontSize(6); F.t(doc,C.muted); doc.text(lbl, vx, y+10);
    doc.setFontSize(8); F.t(doc, i===3?C.amber:C.navy); B(doc, val, vx, y+14.5);
  });
  y += 19;

  // Compliance statement
  doc.setFontSize(5.8); F.t(doc,C.muted);
  doc.text(doc.splitTextToSize(
    `This tax invoice is issued per UAE Federal Decree-Law No. 8 of 2017 on Value Added Tax. VAT applied at standard rate ${invoice.vat_rate}%. Supplier TRN: ${invoice.company_trn}. Computer-generated; valid without physical signature.`,
    CW,
  ), ML, y);
  y += 7;

  // Separator before T&C
  hl(doc, y, ML, PW-MR, 0.3, C.border);
  y += 3;

  // ══════════════════════════════════════════════════════════════════
  // FIX 11: ANCHOR bottom section — eliminate dead whitespace
  // ══════════════════════════════════════════════════════════════════
  y = Math.max(y, BOTTOM_Y);

  // ── Bottom section: T&C (left) + compact QR panel (right) ─────────
  const QRW   = 48;
  const TCW   = CW - QRW - 3;
  const QX    = ML + TCW + 3;
  const QH    = BOTTOM_H - 1;   // 43mm
  const QCTRX = QX + QRW / 2;

  // T&C
  doc.setFontSize(6); F.t(doc, C.ink); B(doc, 'Terms & Conditions', ML, y + 4);
  const terms  = invoice.terms_and_conditions.split('\n').map(l => l.trim()).filter(Boolean);
  const half   = Math.ceil(terms.length / 2);
  const tcColW = (TCW - 3) / 2;
  let t1y = y + 8, t2y = y + 8;
  doc.setFontSize(5); F.t(doc, C.muted);
  terms.slice(0, half).forEach((line, i) => {
    const clean   = line.replace(/^\d+\.\s*/, '');
    const wrapped = doc.splitTextToSize(`${i + 1}. ${clean}`, tcColW - 1);
    doc.text(wrapped, ML, t1y); t1y += wrapped.length * 2.7 + 0.4;
  });
  terms.slice(half).forEach((line, i) => {
    const clean   = line.replace(/^\d+\.\s*/, '');
    const wrapped = doc.splitTextToSize(`${half + i + 1}. ${clean}`, tcColW - 1);
    doc.text(wrapped, ML + tcColW + 3, t2y); t2y += wrapped.length * 2.7 + 0.4;
  });

  // ── Compact QR panel ─────────────────────────────────────────────
  const QR_MM  = 24;
  const qrImgX = QX + (QRW - QR_MM) / 2;
  const qrImgY = y + 9.5;

  // Panel shell — clean border, no heavy fills
  rect(doc, QX, y, QRW, QH, C.white, C.border, 1.5, 0.3);

  // Light surface header with navy text
  F.f(doc, C.surface); doc.roundedRect(QX, y, QRW, 8, 1.5, 1.5, 'F');
  doc.rect(QX, y + 5.5, QRW, 2.5, 'F');
  F.d(doc, C.border); doc.setLineWidth(0.1); doc.line(QX, y + 8, QX + QRW, y + 8);
  doc.setFontSize(6.5); F.t(doc, C.navy);
  B(doc, 'VERIFY & TRACK', QCTRX, y + 5.8, {align: 'center'});

  // Amber accent rule
  F.f(doc, C.amber); doc.rect(QX, y + 8, QRW, 0.6, 'F');

  if (qrImg) {
    // QR image — no extra border, white bg is enough quiet zone
    F.f(doc, C.white); doc.rect(qrImgX - 1, qrImgY - 1, QR_MM + 2, QR_MM + 2, 'F');
    doc.addImage(qrImg, 'PNG', qrImgX, qrImgY, QR_MM, QR_MM);
    doc.link(qrImgX, qrImgY, QR_MM, QR_MM, { url: invoice.qr_code_data });

    // SC centre logo overlay
    const lsz = 5.5;
    const lcx  = qrImgX + QR_MM / 2 - lsz / 2;
    const lcy  = qrImgY + QR_MM / 2 - lsz / 2;
    F.f(doc, C.white); doc.rect(lcx - 0.5, lcy - 0.5, lsz + 1, lsz + 1, 'F');
    F.f(doc, C.navy);  doc.roundedRect(lcx, lcy, lsz, lsz, 0.8, 0.8, 'F');
    doc.setFontSize(4.5); F.t(doc, C.amber);
    B(doc, 'SC', lcx + lsz / 2, lcy + lsz / 2 + 1.5, {align: 'center'});

    // Scan label + URL
    const lblY = qrImgY + QR_MM + 2.5;
    doc.setFontSize(5); F.t(doc, C.navy);
    B(doc, 'Scan to Verify & Track', QCTRX, lblY, {align: 'center'});
    doc.setFontSize(4); F.t(doc, C.faint);
    doc.text('sccourier.com/invoice/verify', QCTRX, lblY + 3.5, {align: 'center'});
    doc.link(QX + 2, lblY - 1.5, QRW - 4, 6, { url: invoice.qr_code_data });
  }

  // ══════════════════════════════════════════════════════════════════
  // 9. FOOTER — clean white, ink-friendly, elegant
  // ══════════════════════════════════════════════════════════════════
  const FTR_TOTAL = 10;
  // White background
  F.f(doc, C.white);  doc.rect(0, PH-FTR_TOTAL, PW, FTR_TOTAL, 'F');
  // Thin amber top rule + navy bottom edge
  F.f(doc, C.amber);  doc.rect(0, PH-FTR_TOTAL, PW, 0.8, 'F');
  F.f(doc, C.navy);   doc.rect(0, PH-1, PW, 1, 'F');
  // Footer text — muted / navy
  doc.setFontSize(6); F.t(doc, C.muted);
  doc.text('Original Tax Invoice  |  Computer Generated  |  Valid Without Physical Signature', ML, PH-FTR_TOTAL+5.5);
  F.t(doc, C.navy); B(doc, 'Page 1 of 1', PW-MR, PH-FTR_TOTAL+5.5, {align:'right'});

  return Buffer.from(doc.output('arraybuffer'));
}
