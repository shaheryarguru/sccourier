import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — SC Courier',
  description: 'Learn how SC Courier collects, uses, and protects your personal information in accordance with UAE data protection laws.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface pt-20 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Header */}
        <div>
          <p className="text-xs font-body font-semibold text-secondary uppercase tracking-wider mb-2">
            Legal
          </p>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-primary">
            Privacy Policy
          </h1>
          <p className="text-sm font-body text-text-secondary mt-2">
            Last updated: April 2026 &nbsp;·&nbsp; Effective immediately
          </p>
        </div>

        <div className="prose prose-sm max-w-none font-body text-text-secondary leading-relaxed space-y-6">

          <Section title="1. Introduction">
            SC Courier LLC (&ldquo;SC Courier&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to
            protecting the privacy and personal data of our customers, senders, recipients, and
            website visitors. This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use our services or visit sccourier.com.
          </Section>

          <Section title="2. Information We Collect">
            <p>We collect the following categories of personal data:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Identity data:</strong> Full name, Emirates ID (optional), company name, trade licence number</li>
              <li><strong>Contact data:</strong> Email address, phone number (including country code), postal address</li>
              <li><strong>Shipment data:</strong> Sender and receiver details, package contents, declared value, delivery instructions</li>
              <li><strong>Financial data:</strong> Payment method, transaction references (we do not store card numbers)</li>
              <li><strong>Technical data:</strong> IP address, browser type, device identifiers, cookies</li>
              <li><strong>Usage data:</strong> Pages visited, tracking queries, booking history</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use your personal data to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Process and fulfil your courier and logistics bookings</li>
              <li>Generate tax invoices compliant with UAE Federal Tax Authority requirements</li>
              <li>Provide real-time shipment tracking and delivery notifications</li>
              <li>Communicate order confirmations, status updates, and support responses</li>
              <li>Comply with UAE legal and regulatory obligations</li>
              <li>Detect fraud and ensure the security of our platform</li>
              <li>Improve our services through aggregated analytics (no PII shared)</li>
            </ul>
          </Section>

          <Section title="4. Legal Basis for Processing">
            We process your data on the following legal bases under UAE Personal Data Protection Law
            (Federal Decree-Law No. 45 of 2021):
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Contract performance:</strong> Data needed to deliver our services</li>
              <li><strong>Legal obligation:</strong> Tax invoicing, VAT records, regulatory compliance</li>
              <li><strong>Legitimate interests:</strong> Fraud prevention, service improvement, security</li>
              <li><strong>Consent:</strong> Marketing communications (opt-in only)</li>
            </ul>
          </Section>

          <Section title="5. Data Sharing">
            <p>We do not sell your personal data. We may share it with:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Delivery partners:</strong> Third-party riders and logistics providers necessary to complete your shipment</li>
              <li><strong>Payment processors:</strong> PCI-DSS compliant payment gateways</li>
              <li><strong>Infrastructure providers:</strong> Supabase (database), Cloudflare (CDN, security), Vercel (hosting)</li>
              <li><strong>Regulatory authorities:</strong> UAE FTA and law enforcement when legally required</li>
            </ul>
            <p className="mt-2">
              All third-party processors are contractually bound to handle your data securely and
              only for the specified purposes.
            </p>
          </Section>

          <Section title="6. Data Retention">
            We retain your personal data for as long as necessary to fulfil the purposes set out in
            this policy and to comply with UAE law. Typically:
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Booking and shipment records: 5 years (UAE VAT law requirement)</li>
              <li>Tax invoices: 5 years from issue date</li>
              <li>Account data: Until account deletion request is processed</li>
              <li>Technical/usage data: 12 months</li>
            </ul>
          </Section>

          <Section title="7. Data Security">
            We implement industry-standard safeguards including:
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>TLS 1.3 encryption for all data in transit (enforced by Cloudflare)</li>
              <li>AES-256 encryption for data at rest (Supabase)</li>
              <li>Row-level security policies restricting data access</li>
              <li>HMAC-SHA256 invoice verification signatures</li>
              <li>Regular security reviews and penetration testing</li>
            </ul>
          </Section>

          <Section title="8. Your Rights">
            Under UAE PDPL and applicable laws, you have the right to:
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data (subject to legal retention requirements)</li>
              <li>Withdraw consent for marketing communications at any time</li>
              <li>Lodge a complaint with the UAE Data Office</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:privacy@sccourier.com" className="text-primary font-medium hover:underline">
                privacy@sccourier.com
              </a>.
            </p>
          </Section>

          <Section title="9. Cookies">
            We use essential cookies for session management and security. Optional analytics cookies
            are only set with your consent. You can control cookie settings in your browser. Disabling
            essential cookies may affect site functionality.
          </Section>

          <Section title="10. International Transfers">
            Your data may be processed on infrastructure located outside the UAE (e.g., Cloudflare
            edge nodes). We ensure adequate safeguards are in place and that any transfer complies
            with UAE PDPL requirements for cross-border data transfers.
          </Section>

          <Section title="11. Changes to This Policy">
            We may update this Privacy Policy from time to time. The &ldquo;Last updated&rdquo; date at the top
            of this page will reflect any changes. Continued use of our services after changes
            constitutes acceptance of the updated policy.
          </Section>

          <Section title="12. Contact Us">
            <p>For privacy-related queries or to exercise your rights:</p>
            <div className="mt-2 space-y-1">
              <p><strong>SC Courier LLC</strong></p>
              <p>Dubai, United Arab Emirates</p>
              <p>
                Email:{' '}
                <a href="mailto:privacy@sccourier.com" className="text-primary font-medium hover:underline">
                  privacy@sccourier.com
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
