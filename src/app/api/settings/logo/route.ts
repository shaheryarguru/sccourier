/**
 * /api/settings/logo
 *
 * GET    — returns current logo_url from company_settings
 * POST   — uploads logo to Supabase Storage (auto-creates bucket), saves URL
 * DELETE — removes logo from storage + clears URL
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET    = 'company-assets';
const LOGO_PATH = 'logo/company-logo.png';

// ── Ensure bucket exists (uses service role — only called during upload) ───────

async function ensureBucket() {
  const admin = createAdminClient();

  const { data: buckets } = await admin.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);

  if (!exists) {
    const { error } = await admin.storage.createBucket(BUCKET, {
      public: true,           // URLs are publicly readable (needed for invoice display)
      fileSizeLimit: 5242880, // 5 MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    });
    if (error) throw new Error(`Could not create storage bucket: ${error.message}`);
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('company_settings')
      .select('logo_url')
      .single();
    return NextResponse.json({ logo_url: data?.logo_url ?? null });
  } catch {
    return NextResponse.json({ logo_url: null });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Use PNG, JPG, WEBP, or SVG.' },
      { status: 400 },
    );
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
  }

  try {
    // Auto-create the bucket if it doesn't exist yet
    await ensureBucket();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Storage setup failed';
    console.error('[logo bucket]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Use admin client for upload so RLS on storage doesn't block it
  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(LOGO_PATH, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: '3600',
    });

  if (uploadError) {
    console.error('[logo upload]', uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Build public URL + cache-bust
  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(LOGO_PATH);
  const logoUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  // Persist to company_settings using admin client to bypass RLS
  const { error: settingsError } = await admin
    .from('company_settings')
    .upsert({ id: 1, logo_url: logoUrl, updated_at: new Date().toISOString() });

  if (settingsError) {
    console.error('[logo settings]', settingsError);
    return NextResponse.json({ error: settingsError.message }, { status: 500 });
  }

  return NextResponse.json({ logo_url: logoUrl });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE() {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  await admin.storage.from(BUCKET).remove([LOGO_PATH]);

  await admin
    .from('company_settings')
    .update({ logo_url: null, updated_at: new Date().toISOString() })
    .eq('id', 1);

  return NextResponse.json({ logo_url: null });
}
