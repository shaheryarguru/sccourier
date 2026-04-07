import type { Metadata } from 'next';
import { Suspense }       from 'react';
import { Loader2 }        from 'lucide-react';
import { VerifyResult }   from './_components/VerifyResult';

export const metadata: Metadata = {
  title: 'Invoice Verification — SC Courier',
  description: 'Verify the authenticity of an SC Courier tax invoice using its QR code digital signature.',
};

interface Props {
  searchParams: Promise<{ data?: string; sig?: string; trackingId?: string }>;
}

function VerifyLoading() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-12 text-center space-y-4">
      {/* Accent bar */}
      <div className="h-1.5 bg-[#F59E0B] w-full absolute top-0 left-0 rounded-t-2xl" />
      <Loader2 className="size-12 text-[#0F2B46] animate-spin mx-auto" aria-hidden="true" />
      <div>
        <p className="font-heading font-semibold text-[#0F172A] text-lg">Verifying Signature…</p>
        <p className="font-body text-[#64748B] text-sm mt-1">
          Checking HMAC-SHA256 digital signature
        </p>
      </div>
    </div>
  );
}

export default async function InvoiceVerifyPage({ searchParams }: Props) {
  const { data, sig, trackingId } = await searchParams;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-24 lg:pb-10 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Page title */}
        <div className="text-center mb-6">
          <p className="text-xs font-body font-bold text-[#64748B] uppercase tracking-widest">
            SC Courier · Invoice Verification
          </p>
        </div>

        <div className="relative">
          <Suspense fallback={<VerifyLoading />}>
            <VerifyResult
              data={data}
              sig={sig}
              trackingId={trackingId}
            />
          </Suspense>
        </div>

        <p className="text-center text-[10px] font-body text-[#94A3B8] mt-4">
          Secured by HMAC-SHA256 · UAE Federal Decree-Law No. 8 of 2017
        </p>
      </div>
    </div>
  );
}
