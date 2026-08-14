import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardView from '@/components/dashboard-view';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Authenticate user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // 2. Fetch user profile, Career DNA, resume scans, and applications in parallel
  const [{ data: profile }, { data: careerDna }, { data: resumeScans }, { data: applications }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('career_dna').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('resume_scans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

  // 3. If Career DNA is missing for the authenticated user, guide candidate to onboarding
  if (!careerDna) {
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-[#181715] flex flex-col justify-between">
      <DashboardView
        userEmail={user.email}
        userName={profile?.full_name || profile?.name}
        careerDnaData={careerDna}
        resumeScansData={resumeScans}
        applicationsData={applications}
      />
    </div>
  );
}
