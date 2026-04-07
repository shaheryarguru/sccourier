import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ── PATCH /api/booking/[id]/restore ──────────────────────────────────────────
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing booking id' }, { status: 400 });

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('bookings')
    .update({
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'RESTORE_FAILED', message: error?.message ?? 'Booking not found' },
      { status: 500 },
    );
  }

  return NextResponse.json({ booking: data }, { status: 200 });
}
