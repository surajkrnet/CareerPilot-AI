import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardView from '@/components/dashboard-view';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let user = null;
  let profile = null;
  let careerDna = null;
  let applications = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;

    if (user) {
      const [{ data: pData }, { data: cData }, { data: aData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('career_dna').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      profile = pData;
      careerDna = cData;
      applications = aData;
    }
  } catch (err) {
    console.warn('Dashboard server session notice:', err);
  }

  // If user is unauthenticated on server, still render dashboard view gracefully
  // (client side will also check Supabase / careerStore local cache)
  return (
    <div className="min-h-screen bg-[#181715] flex flex-col justify-between">
      <DashboardView
        userEmail={user?.email}
        userName={profile?.full_name || profile?.name}
        careerDnaData={careerDna}
        applicationsData={applications}
      />
    </div>
  );
}
