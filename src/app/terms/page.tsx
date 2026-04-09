import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — SC Courier',
  description: 'Read SC Courier\'s terms and conditions governing the use of our courier and logistics services across the UAE.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface pt-20 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Header */}
        <div>
          <p className="text-xs font-body font-semibold text-secondary uppercase tracking-wider mb-2">
            Legal
          </p>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-primary">
            Terms of Service
          </h1>
          <p className="text-sm font-body text-text-secondary mt-2">
            Last updated: April 2026 &nbsp;·&nbsp; Effective immediately
          </p>
        </div>

        <div className="prose prose-sm max-w-none font-body text-text-secondary leading-relaxed space-y-6">

          <Section title="1. Acceptance of Terms">
            By using SC Courier&apos;s services (including our website at sccourier.com, mobile applications,
            and courier services), you agree to be bound by these Terms of Service and our{' '}
            <a href="/privacy" className="text-primary font-medium hover:underline">Privacy Policy</a>.
            If you do not agree, you must not use our services.
          </Section>

          <Section title="2. Services">
            SC Courier LLC provides courier, parcel delivery, and logistics services across the United
            Arab Emirates and internationally. Services include:
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Standard delivery (2–3 business days within UAE)</li>
              <li>Express delivery (next business day)</li>
              <li>Same-day delivery (within 6 hours, selected areas)</li>
              <li>International shipping (5–10 business days)</li>
              <li>Cargo and freight (heavy/bulk shipments, custom quote)</li>
            </ul>
          </Section>

          <Section title="3. Booking and Tracking">
            <p>
              When you place a booking, you will receive a unique tracking ID in the format{' '}
              <code className="bg-surface px-1 py-0.5 rounded text-primary font-mono text-xs">SCDDMM####</code>{' '}
              and a booking confirmation number. It is your responsibility to provide accurate sender
              and receiver information. SC Courier accepts no liability for failed deliveries caused
              by incorrect address details.
            </p>
          </Section>

          <Section title="4. Prohibited Items">
            The following items are strictly prohibited from shipping:
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Dangerous goods, explosives, flammable liquids or gases</li>
              <li>Controlled substances and narcotics</li>
              <li>Weapons, firearms, and ammunition</li>
              <li>Counterfeit goods and pirated materials</li>
              <li>Live animals (unless specifically authorised in writing)</li>
              <li>Currency, negotiable instruments, and precious stones exceeding AED 5,000 declared value without insurance</li>
              <li>Any item prohibited under UAE Federal Law</li>
            </ul>
            <p className="mt-2">
              SC Courier reserves the right to inspect any package and refuse or return shipments
              suspected of containing prohibited items. The sender bears full legal responsibility
              for the contents of any shipment.
            </p>
          </Section>

          <Section title="5. Liability and Claims">
            <ul className="list-disc pl-5 space-y-1">
              <li>Liability for loss or damage is limited to the declared value or <strong>AED 100</strong>, whichever is lower, unless Package Insurance is purchased at booking</li>
              <li>Package Insurance covers up to the full declared value (2% of declared value fee applies)</li>
              <li>Claims must be filed within <strong>7 days</strong> of delivery or expected delivery date</li>
              <li>SC Courier is not liable for loss or delay caused by force majeure, customs clearance, weather events, or actions beyond our reasonable control</li>
              <li>Consequential, indirect, or special damages are excluded to the fullest extent permitted by UAE law</li>
            </ul>
          </Section>

          <Section title="6. Delivery">
            <ul className="list-disc pl-5 space-y-1">
              <li>Estimated delivery dates are indicative only and not contractually guaranteed</li>
              <li>Two delivery attempts will be made at no additional charge</li>
              <li>Subsequent re-delivery attempts are charged at <strong>AED 15 per attempt</strong></li>
              <li>If a package cannot be delivered after 3 attempts, it will be returned to the sender; return shipping charges apply</li>
              <li>Packages requiring a signature will not be left unattended without the recipient&apos;s express consent</li>
            </ul>
          </Section>

          <Section title="7. Cash on Delivery (COD)">
            <ul className="list-disc pl-5 space-y-1">
              <li>A COD fee of <strong>AED 15</strong> applies per shipment</li>
              <li>COD amounts are collected from the recipient in AED only</li>
              <li>COD remittance to the sender is processed within <strong>3–5 business days</strong> after successful delivery</li>
              <li>SC Courier is not responsible for COD collection where the recipient refuses payment; the sender bears the cost of return shipping</li>
            </ul>
          </Section>

          <Section title="8. Pricing and Payment">
            <ul className="list-disc pl-5 space-y-1">
              <li>All prices are quoted in <strong>UAE Dirhams (AED)</strong></li>
              <li>VAT is charged at <strong>5%</strong> as required by the UAE Federal Tax Authority</li>
              <li>Final pricing is calculated server-side based on package weight, dimensions, service type, and applicable surcharges</li>
              <li>Cancellation after pickup incurs a minimum charge of <strong>AED 25</strong></li>
              <li>Invoices are issued in compliance with UAE FTA tax invoice requirements</li>
            </ul>
          </Section>

          <Section title="9. Packaging">
            The sender is responsible for ensuring packages are adequately packaged to withstand normal
            handling in transit. SC Courier will not be liable for damage caused by inadequate packaging.
            Fragile items must be declared and appropriately packed with internal cushioning.
          </Section>

          <Section title="10. Customs and International Shipments">
            For international shipments, the sender is responsible for:
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Providing accurate customs declarations and commercial invoices</li>
              <li>Ensuring goods are permitted for export from the UAE and import to the destination country</li>
              <li>Paying any applicable customs duties, taxes, or fees at origin or destination</li>
            </ul>
            <p className="mt-2">
              SC Courier acts as agent for customs purposes only and accepts no liability for customs
              delays or seizures arising from incomplete or inaccurate documentation.
            </p>
          </Section>

          <Section title="11. Intellectual Property">
            All content on sccourier.com, including text, graphics, logos, and software, is the
            property of SC Courier LLC and protected under UAE intellectual property law. Unauthorised
            reproduction or distribution is prohibited.
          </Section>

          <Section title="12. Governing Law">
            These Terms are governed by the laws of the <strong>United Arab Emirates</strong>. Any disputes
            arising from these Terms or the use of our services shall be subject to the exclusive
            jurisdiction of the courts of Dubai, UAE.
          </Section>

          <Section title="13. Changes to Terms">
            SC Courier reserves the right to modify these Terms at any time. The &ldquo;Last updated&rdquo; date
            will reflect changes. Your continued use of our services after changes constitutes
            acceptance of the revised Terms.
          </Section>

          <Section title="14. Contact">
            <p>For questions about these Terms:</p>
            <div className="mt-2 space-y-1">
              <p><strong>SC Courier LLC</strong></p>
              <p>Dubai, United Arab Emirates</p>
              <p>
                Email:{' '}
                <a href="mailto:legal@sccourier.com" className="text-primary font-medium hover:underline">
                  legal@sccourier.com
                </a>
              </p>
              <p>
                Phone:{' '}
                <a href="tel:+97144000000" className="text-primary font-medium hover:underline">
                  +971 4 400 0000
                </a>
              </p>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-heading font-semibold text-lg text-primary mb-2">{title}</h2>
      <div className="text-sm font-body text-text-secondary leading-relaxed">{children}</div>
    </div>
  );
}
