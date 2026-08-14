import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardView from '@/components/dashboard-view';

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth');
  }

  // 2. Fetch user profile, Career DNA, and applications from Supabase in parallel
  const [{ data: profile }, { data: careerDna }, { data: applications }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('career_dna').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ]);

  // If Career DNA is missing, guide candidate to onboarding
  if (!careerDna) {
    redirect('/onboarding');
  }

  return (
    <main className="min-h-screen bg-[#181715]">
      <DashboardView
        userEmail={user.email}
        userName={profile?.full_name || profile?.name}
        careerDnaData={careerDna}
        applicationsData={applications}
      />
    </main>
  );
}
