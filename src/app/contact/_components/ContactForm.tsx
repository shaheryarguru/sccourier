'use client';

import React, { useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';

// ── Validation schema ─────────────────────────────────────────────────────────
const ContactSchema = z.object({
  name:    z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:   z.string().email('Enter a valid email address'),
  phone:   z.string().optional(),
  subject: z.string().min(1, 'Please select a subject'),
  message: z.string().min(20, 'Message must be at least 20 characters').max(2000),
});

type ContactFields = z.infer<typeof ContactSchema>;
type FieldErrors   = Partial<Record<keyof ContactFields, string>>;

const SUBJECTS = [
  'General Enquiry',
  'Shipment Issue / Complaint',
  'Pricing & Quote',
  'Business / Corporate Account',
  'Tracking Help',
  'Invoice / Payment',
  'Lost or Damaged Package',
  'Partnership Enquiry',
  'Other',
];

// ── Form ─────────────────────────────────────────────────────────────────────

export function ContactForm() {
  const [form, setForm]       = useState<ContactFields>({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors]   = useState<FieldErrors>({});
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState('');

  function set(field: keyof ContactFields, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Client-side validation
    const result = ContactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ContactFields;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setStatus('loading');
    setServerError('');

    // Simulate submission (replace with actual API call when email service is configured)
    await new Promise(r => setTimeout(r, 1200));

    // In production, POST to /api/contact:
    // const res = await fetch('/api/contact', { method: 'POST', headers: {...}, body: JSON.stringify(result.data) });
    // if (!res.ok) { setStatus('error'); setServerError('...'); return; }

    setStatus('success');
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <div className="size-16 rounded-2xl bg-accent/10 flex items-center justify-center">
          <CheckCircle2 className="size-8 text-accent" aria-hidden="true" />
        </div>
        <h3 className="font-heading font-bold text-xl text-primary">Message Sent!</h3>
        <p className="font-body text-text-secondary max-w-xs">
          Thanks for reaching out, {form.name.split(' ')[0]}. We&apos;ll get back to you within
          1 business day. Check your email for a confirmation.
        </p>
        <button
          type="button"
          onClick={() => { setForm({ name: '', email: '', phone: '', subject: '', message: '' }); setStatus('idle'); }}
          className="mt-2 text-sm font-body font-semibold text-primary hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">

      {/* Server error */}
      {serverError && (
        <div className="flex items-start gap-2.5 bg-danger/5 border border-danger/20 rounded-xl px-4 py-3" role="alert">
          <AlertCircle className="size-4 text-danger shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm font-body text-danger">{serverError}</p>
        </div>
      )}

      {/* Name + Email */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          id="contact-name"
          label="Full Name"
          required
          error={errors.name}
        >
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            required
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Ahmed Al Rashidi"
            aria-describedby={errors.name ? 'contact-name-err' : undefined}
            className={inputCls(!!errors.name)}
          />
        </Field>

        <Field
          id="contact-email"
          label="Email Address"
          required
          error={errors.email}
        >
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="ahmed@company.com"
            aria-describedby={errors.email ? 'contact-email-err' : undefined}
            className={inputCls(!!errors.email)}
          />
        </Field>
      </div>

      {/* Phone + Subject */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field id="contact-phone" label="Phone Number" error={errors.phone}>
          <input
            id="contact-phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="+971 50 123 4567"
            className={inputCls(false)}
          />
        </Field>

        <Field id="contact-subject" label="Subject" required error={errors.subject}>
          <select
            id="contact-subject"
            required
            value={form.subject}
            onChange={e => set('subject', e.target.value)}
            aria-describedby={errors.subject ? 'contact-subject-err' : undefined}
            className={inputCls(!!errors.subject)}
          >
            <option value="" disabled>Select a subject…</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      {/* Message */}
      <Field id="contact-message" label="Message" required error={errors.message}>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={form.message}
          onChange={e => set('message', e.target.value)}
          placeholder="Describe how we can help you…"
          aria-describedby={errors.message ? 'contact-message-err' : undefined}
          className={`${inputCls(!!errors.message)} resize-none`}
        />
      </Field>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full h-12 bg-primary text-white font-body font-semibold text-sm rounded-xl hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {status === 'loading'
          ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Sending…</>
          : 'Send Message'
        }
      </button>

      <p className="text-[11px] font-body text-text-disabled text-center">
        We respect your privacy. Your information is never shared with third parties.
      </p>
    </form>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return [
    'w-full px-3.5 py-2.5 text-sm font-body bg-white rounded-xl transition-colors',
    'border-2 focus:outline-none focus:ring-0',
    'placeholder:text-text-disabled',
    hasError
      ? 'border-danger focus:border-danger'
      : 'border-border focus:border-secondary',
  ].join(' ');
}

function Field({
  id, label, required, error, children,
}: {
  id:        string;
  label:     string;
  required?: boolean;
  error?:    string;
  children:  React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-body font-medium text-text-primary">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} role="alert" className="text-xs font-body text-danger flex items-center gap-1">
          <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
