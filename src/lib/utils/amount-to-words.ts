/**
 * Convert a numeric AED amount to words, UAE Dirham style.
 *
 * Examples:
 *   amountToWords(115.50) → "One Hundred And Fifteen UAE Dirhams And Fifty Fils Only"
 *   amountToWords(1000)   → "One Thousand UAE Dirhams Only"
 *   amountToWords(285.01) → "Two Hundred And Eighty-Five UAE Dirhams And One Fils Only"
 */

const ONES: string[] = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
  'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];

const TENS: string[] = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
  'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function wordsUnder1000(n: number): string {
  if (n === 0) return '';

  if (n < 20) return ONES[n];

  if (n < 100) {
    const ten  = Math.floor(n / 10);
    const unit = n % 10;
    return unit === 0
      ? TENS[ten]
      : `${TENS[ten]}-${ONES[unit]}`;
  }

  // 100 – 999
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  const hundredPart = `${ONES[hundreds]} Hundred`;
  if (remainder === 0) return hundredPart;
  return `${hundredPart} And ${wordsUnder1000(remainder)}`;
}

function integerToWords(n: number): string {
  if (n === 0) return 'Zero';
  if (n < 0) return `Negative ${integerToWords(-n)}`;

  const parts: string[] = [];

  const billions = Math.floor(n / 1_000_000_000);
  if (billions > 0) {
    parts.push(`${wordsUnder1000(billions)} Billion`);
    n %= 1_000_000_000;
  }

  const millions = Math.floor(n / 1_000_000);
  if (millions > 0) {
    parts.push(`${wordsUnder1000(millions)} Million`);
    n %= 1_000_000;
  }

  const thousands = Math.floor(n / 1_000);
  if (thousands > 0) {
    parts.push(`${wordsUnder1000(thousands)} Thousand`);
    n %= 1_000;
  }

  if (n > 0) {
    if (parts.length > 0) {
      parts.push(`And ${wordsUnder1000(n)}`);
    } else {
      parts.push(wordsUnder1000(n));
    }
  }

  return parts.join(' ');
}

/**
 * Convert an AED amount (up to billions) to English words.
 *
 * @param amount   Numeric AED value (e.g. 115.50)
 * @returns        Human-readable string, e.g.
 *                 "One Hundred And Fifteen UAE Dirhams And Fifty Fils Only"
 */
export function amountToWords(amount: number): string {
  // Round to 2 decimal places to avoid floating-point noise
  const rounded   = Math.round(amount * 100) / 100;
  const dirhams   = Math.floor(rounded);
  const fils      = Math.round((rounded - dirhams) * 100);

  const dirhamWords = integerToWords(dirhams);

  const dirhamPart = `${dirhamWords} UAE Dirham${dirhams === 1 ? '' : 's'}`;

  if (fils === 0) {
    return `${dirhamPart} Only`;
  }

  const filsPart = `${integerToWords(fils)} Fils`;
  return `${dirhamPart} And ${filsPart} Only`;
}
