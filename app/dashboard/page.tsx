import { createClient } from '@/lib/supabase/server';
import DashboardView from '@/components/dashboard-view';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function DashboardPage() {
  let user = null;
  let profile = null;
  let careerDna = null;
  let resumeScans = null;
  let applications = null;
  let interviewSessions = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;

    if (user) {
      const [
        { data: pData },
        { data: cData },
        { data: rData },
        { data: aData },
        { data: iData },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('career_dna').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('resume_scans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('interview_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      profile = pData;
      careerDna = cData;
      resumeScans = rData;
      applications = aData;
      interviewSessions = iData;
    }
  } catch (err) {
    console.warn('Dashboard server session notice:', err);
  }

  return (
    <div className="min-h-screen bg-[#181715] flex flex-col justify-between">
      <DashboardView
        userEmail={user?.email}
        userName={profile?.full_name || profile?.name || (user?.user_metadata?.full_name as string)}
        careerDnaData={careerDna}
        resumeScansData={resumeScans}
        applicationsData={applications}
        interviewSessionsData={interviewSessions}
      />
    </div>
  );
}
