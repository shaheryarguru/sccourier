import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminShell } from './_components/AdminShell';

export const metadata = {
  title: { template: '%s — SC Admin', default: 'Admin — SC Courier' },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const userName  = (user.user_metadata?.full_name as string | undefined)
                 ?? (user.user_metadata?.name     as string | undefined)
                 ?? undefined;

  return (
    <AdminShell userEmail={user.email} userName={userName}>
      {children}
    </AdminShell>
  );
}
